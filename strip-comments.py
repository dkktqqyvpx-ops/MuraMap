"""
MuraMap — создание копии проекта без комментариев.

Запуск из папки проекта:
    python tools/strip-comments.py

Оригиналы не меняются: чистая копия складывается в папку dist/.
Обрабатываются .js, .css и .html. Остальные файлы копируются как есть.
"""

import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "dist"
SKIP_DIRS = {"dist", ".git", "node_modules", ".vscode"}


REGEX_ALLOWED_BEFORE = set("(,=:[!&|?{};+-*%~^<>") | {""}
REGEX_KEYWORDS = {"return", "typeof", "case", "in", "of", "new", "delete",
                  "do", "else", "yield", "void", "instanceof", "throw", "await"}


def regex_can_start(done):
    """По уже разобранному коду решает, начинается ли здесь регулярка."""
    text = done.rstrip()
    if not text:
        return True
    last = text[-1]
    if last in REGEX_ALLOWED_BEFORE:
        return True
    word = re.findall(r"[A-Za-z_$]+$", text)
    return bool(word) and word[0] in REGEX_KEYWORDS


def strip_js(code, line_comments=True):
    """Убирает /* ... */ и // ..., не трогая кавычки и регулярные выражения."""
    out = []
    i = 0
    n = len(code)
    quote = None          # активная кавычка: ' " `
    while i < n:
        ch = code[i]
        nxt = code[i + 1] if i + 1 < n else ""

        if quote:
            out.append(ch)
            if ch == "\\":                     # экранированный символ
                if i + 1 < n:
                    out.append(nxt)
                    i += 2
                    continue
            elif ch == quote:
                quote = None
            i += 1
            continue

        if ch in "'\"`":
            quote = ch
            out.append(ch)
            i += 1
            continue

        # Регулярное выражение: /^MURA-\d{3}$/ — внутри могут быть / и //
        if ch == "/" and nxt not in "/*" and regex_can_start("".join(out)):
            j = i + 1
            in_class = False
            while j < n:
                c = code[j]
                if c == "\\":
                    j += 2
                    continue
                if c == "[":
                    in_class = True
                elif c == "]":
                    in_class = False
                elif c == "/" and not in_class:
                    break
                elif c == "\n":
                    break
                j += 1
            out.append(code[i:j + 1])
            i = j + 1
            continue

        if ch == "/" and nxt == "*":
            end = code.find("*/", i + 2)
            i = n if end == -1 else end + 2
            continue

        if line_comments and ch == "/" and nxt == "/":
            end = code.find("\n", i)
            i = n if end == -1 else end
            continue

        out.append(ch)
        i += 1

    return "\n".join(line.rstrip() for line in "".join(out).splitlines())


def squeeze(text):
    """Схлопывает пустые строки, оставшиеся от комментариев."""
    return re.sub(r"\n{3,}", "\n\n", text).strip() + "\n"


def strip_css(code):
    return squeeze(strip_js(code, line_comments=False))


def strip_html(code):
    # <!--[if IE]> и подобные условные комментарии оставляем
    return squeeze(re.sub(r"<!--(?!\[if)(?:(?!-->).)*-->\s*", "", code, flags=re.S))


HANDLERS = {".js": lambda c: squeeze(strip_js(c)), ".css": strip_css, ".html": strip_html}


def main():
    if OUT.exists():
        shutil.rmtree(OUT)

    files = 0
    for src in ROOT.rglob("*"):
        if not src.is_file():
            continue
        if any(part in SKIP_DIRS for part in src.relative_to(ROOT).parts):
            continue

        dst = OUT / src.relative_to(ROOT)
        dst.parent.mkdir(parents=True, exist_ok=True)

        handler = HANDLERS.get(src.suffix.lower())
        if handler:
            text = src.read_text(encoding="utf-8")
            dst.write_text(handler(text), encoding="utf-8")
            saved = len(text) - len(dst.read_text(encoding="utf-8"))
            print(f"{src.relative_to(ROOT)} — убрано {saved} символов")
            files += 1
        else:
            shutil.copy2(src, dst)

    print(f"\nГотово. Обработано файлов: {files}. Результат в папке dist/")


if __name__ == "__main__":
    main()
