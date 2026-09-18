/*
 * MuraMap · Study module — shared core.
 *
 * Everything here is provenance-first: a value is only ever shown together
 * with the VerifiedFact it came from (source URL, domain, date, confidence).
 * Calculated values (distances, travel times, monthly equivalents, currency
 * conversions, summed budgets) are always labelled as estimates.
 */
(function (global) {
  'use strict';

  const LANG_KEY = 'mura-lang';
  const LANGS = ['kk', 'ru', 'en'];

  const I18N = {
    kk: {
      navGuide: 'Гид', navMap: 'Карта', navQr: 'QR', navStudy: 'Оқу',
      skip: 'Негізгі мазмұнға өту',
      back: 'Университеттер тізімі',
      loading: 'Жүктелуде…',
      failed: 'Деректер жүктелмеді. Файлды тексеріңіз: data/universities.json',
      notFound: 'Мұндай университет базада жоқ.',
      website: 'Ресми сайт',
      askGuide: 'Гидтен сұрау',
      openProfile: 'Профильді ашу',

      studyTitle: 'Университеттер',
      studyLead: 'Университет қай жерде, қалада тұру қанша тұрады, жатақхана, оқу ақысы және тарихы — барлығы дереккөзімен.',
      searchLabel: 'Іздеу',
      searchPlaceholder: 'Университет немесе қала атауы',
      noResults: 'Ештеңе табылмады',
      countUniversities: '{n} университет',
      compareHint: 'Салыстыру үшін екі университетті белгілеңіз',
      compareBtn: 'Салыстыру',
      compareTitle: 'Университеттерді салыстыру',
      compareLead: 'Тек фактілер қатар көрсетіледі. Рейтинг жоқ — шешімді өзіңіз қабылдайсыз.',
      pickA: 'Бірінші университет',
      pickB: 'Екінші университет',
      noRank: 'Бұл салыстыру ешбір университетті «жақсырақ» деп атамайды.',

      atGlance: 'Қысқаша',
      glLocation: 'Орналасуы',
      glCampus: 'Кампус',
      glHousing: 'Тұрғын үй',
      glBudget: 'Студент бюджеті',
      glTuition: 'Оқу ақысы',
      glTransport: 'Көлік',
      glFounded: 'Құрылған жылы',
      kmFromCenter: '{km} км қала орталығынан',
      fromPrice: '{price} бастап',
      perMonth: '/ ай',
      perYear: '/ жыл',
      perSemester: '/ семестр',
      perDay: '/ күн',
      perCredit: '/ кредит',
      perProgram: '/ бағдарлама',
      perLevel: '/ деңгей',
      programSpecific: 'бағдарламаға байланысты',
      notVerified: 'расталмады',
      minToCenter: '~{min} мин орталыққа',
      estimate: 'болжам',
      estimated: 'Болжамды',
      approx: 'шамамен',
      calculated: 'есептелген',
      campusNote: 'Кампус',
      multiCampus: 'Университеттің бірнеше кампусы бар — картада таңдалған кампус көрсетілген.',

      secGallery: 'Галерея',
      galleryNote: 'Суреттер тек тексерілген дереккөзден көрсетіледі.',
      secMap: 'Кампус картасы',
      secDistance: 'Қала орталығына дейін',
      secHousing: 'Студенттік тұрғын үй',
      secCost: 'Тұрмыс шығындары',
      secTuition: 'Оқу ақысы',
      secLife: 'Студенттік өмір',
      secHistory: 'Университет тарихы',
      secTransport: 'Көлікпен жету',
      secClimate: 'Климат',
      secSources: 'Дереккөздер',

      legUniversity: 'Университет', legCityCenter: 'Қала орталығы', legDormitory: 'Жатақхана',
      legLibrary: 'Кітапхана', legBuilding: 'Оқу ғимараты', legSports: 'Спорт кешені',
      legTransit: 'Қоғамдық көлік', legAirport: 'Әуежай', legRail: 'Теміржол вокзалы', legBusStation: 'Автовокзал',
      mapAttribution: 'Карта: © OpenStreetMap авторлары',

      distToCenter: 'Қала орталығына дейінгі қашықтық',
      straightLine: 'Тура сызық бойынша (Haversine формуласы)',
      cityCenterRef: 'Орталық нүктесі',
      byCar: 'Көлікпен',
      byTransit: 'Қоғамдық көлікпен',
      walking: 'Жаяу',
      travelNote: 'Уақыт — болжам: тура қашықтық × 1,3 жол коэффициенті және қаладағы орташа жылдамдық. Бұл нақты уақыт емес.',
      travelRouted: 'Көлік уақыты OSRM (OpenStreetMap) маршрутынан алынды, шамамен. Қоғамдық көлік — болжам.',
      roadDistance: 'жол бойынша',

      roomType: 'Бөлме түрі',
      distFromCampus: '{km} км кампустан',
      facilities: 'Жағдайлар',
      fac_wifi: 'Wi-Fi', fac_laundry: 'Кір жуу', fac_study_area: 'Оқу аймағы', fac_gym: 'Спортзал',
      fac_canteen: 'Асхана', fac_security: 'Күзет', fac_kitchen: 'Асүй', fac_parking: 'Тұрақ', fac_medical: 'Медпункт',
      monthlyEquiv: '≈ {price} / ай (есептелген: {period} бағасы ÷ {div})',
      noHousing: 'Жатақхана туралы расталған деректер табылмады.',

      budgetTitle: 'Болжамды студент бюджеті',
      cat_accommodation: 'Пәтер жалдау', cat_dormitory: 'Жатақхана', cat_food: 'Тамақ', cat_transport: 'Көлік',
      cat_mobile_internet: 'Байланыс / интернет', cat_personal: 'Жеке шығындар', cat_total: 'Барлығы (болжам)', cat_utilities: 'Коммуналдық',
      sumNote: 'Қосынды жоғарыдағы санаттардан есептелген; дереккөз жалпы соманы бермейді.',
      totalSourced: 'Жалпы сома дереккөзден алынды.',
      noCost: 'Тұрмыс шығындары туралы расталған деректер табылмады.',

      lvl_undergraduate: 'Бакалавриат', lvl_graduate: 'Магистратура', lvl_foundation: 'Дайындық курсы', lvl_phd: 'Докторантура',
      aud_domestic: 'ҚР азаматтары', aud_international: 'Шетелдік студенттер', aud_all: 'Барлық студенттер',
      academicYear: 'Оқу жылы',
      tuitionNote: 'Оқу ақысы бағдарламаға байланысты өзгереді — бір баға барлық мамандыққа қолданылмайды.',
      noTuition: 'Оқу ақысы туралы ақпаратты сенімді түрде растау мүмкін болмады.',

      life_organizations: 'Студенттік ұйымдар', life_sports: 'Спорт', life_laboratories: 'Зертханалар', life_events: 'Іс-шаралар',
      life_clubs: 'Клубтар', life_facilities: 'Кампус инфрақұрылымы', life_study_spaces: 'Оқу орындары', life_dining: 'Тамақтану', life_recreation: 'Демалыс',
      noLife: 'Студенттік өмір туралы расталған деректер табылмады.',

      today: 'Бүгін',
      noHistory: 'Тарих туралы расталған деректер табылмады.',

      tr_bus: 'Автобус', tr_metro: 'Метро', tr_lrt: 'LRT', tr_tram: 'Трамвай', tr_taxi: 'Такси', tr_airport: 'Әуежай',
      tr_rail: 'Теміржол', tr_bus_station: 'Автовокзал', tr_bike: 'Велосипед',
      distanceTo: '{name}: ~{km} км (тура сызық), көлікпен ~{min} мин',
      transportApprox: 'Қашықтықтар координаттар бойынша есептелген; нақты маршрут уақыты өзгеше болуы мүмкін.',
      noTransport: 'Көлік туралы расталған деректер табылмады.',

      cl_avg_annual_temp: 'Орташа жылдық температура', cl_avg_jan_temp: 'Қаңтар (орташа)', cl_avg_jul_temp: 'Шілде (орташа)',
      cl_annual_precipitation_mm: 'Жылдық жауын-шашын', cl_summary: 'Сипаттама',
      liveClimate: 'Open-Meteo архиві бойынша {year} жылғы деректер (кампус координаттары)',
      liveJan: 'Қаңтар', liveJul: 'Шілде', liveYear: 'Жыл', livePrecip: 'Жауын-шашын',
      climateUnavailable: 'Онлайн климат деректері қолжетімсіз.',
      noClimate: 'Климат туралы расталған деректер табылмады.',

      conf_high: 'Жоғары сенімділік · ресми университет дереккөзі',
      conf_medium: 'Орташа сенімділік · сенімді сыртқы дереккөз',
      conf_low: 'Төмен сенімділік · дәлел шектеулі',
      conf_estimate: 'Есептелген болжам',
      collected: 'Жиналған күні: {date}',
      sourceDate: 'Дереккөз күні: {date}',
      sourceDateUnknown: 'Дереккөз күні белгісіз',
      viewSource: 'Дереккөз',
      evidence: 'Дәлел',
      sourcesLead: 'Осы беттегі әрбір факт төмендегі дереккөздердің біріне сүйенеді.',
      freshnessNote: 'Бағалар мен маршруттар өзгеруі мүмкін. Көрсетілген күні жиналған деректер ағымдағы баға ретінде қабылданбауы тиіс.',

      rateNote: '≈ шамамен, {base}→{quote} бағамы {rate} ({date}, {source})',
      rateUnavailable: 'Валюта бағамы қолжетімсіз',

      cmp_location: 'Орналасуы', cmp_distance: 'Орталыққа дейін', cmp_housing: 'Жатақхана', cmp_tuition: 'Оқу ақысы',
      cmp_budget: 'Тұрмыс шығындары', cmp_life: 'Студенттік өмір', cmp_climate: 'Климат', cmp_transport: 'Әуежайға дейін',
      cmp_founded: 'Құрылған', noData: 'дерек жоқ'
    },

    ru: {
      navGuide: 'Гид', navMap: 'Карта', navQr: 'QR', navStudy: 'Учёба',
      skip: 'Перейти к содержимому',
      back: 'К списку университетов',
      loading: 'Загружаем…',
      failed: 'Данные не загрузились. Проверьте файл data/universities.json',
      notFound: 'Такого университета нет в базе.',
      website: 'Официальный сайт',
      askGuide: 'Спросить гида',
      openProfile: 'Открыть профиль',

      studyTitle: 'Университеты',
      studyLead: 'Где находится университет, сколько стоит жить в городе, общежития, стоимость обучения и история — всё с источниками.',
      searchLabel: 'Поиск',
      searchPlaceholder: 'Название университета или города',
      noResults: 'Ничего не найдено',
      countUniversities: 'Университетов: {n}',
      compareHint: 'Отметьте два университета, чтобы сравнить',
      compareBtn: 'Сравнить',
      compareTitle: 'Сравнение университетов',
      compareLead: 'Только факты рядом. Без рейтинга — решение принимаете вы.',
      pickA: 'Первый университет',
      pickB: 'Второй университет',
      noRank: 'Это сравнение не называет ни один университет «лучше».',

      atGlance: 'Коротко',
      glLocation: 'Расположение',
      glCampus: 'Кампус',
      glHousing: 'Жильё',
      glBudget: 'Бюджет студента',
      glTuition: 'Обучение',
      glTransport: 'Транспорт',
      glFounded: 'Основан',
      kmFromCenter: '{km} км от центра города',
      fromPrice: 'от {price}',
      perMonth: '/ мес',
      perYear: '/ год',
      perSemester: '/ семестр',
      perDay: '/ день',
      perCredit: '/ кредит',
      perProgram: '/ программа',
      perLevel: '/ уровень',
      programSpecific: 'зависит от программы',
      notVerified: 'не подтверждено',
      minToCenter: '~{min} мин до центра',
      estimate: 'оценка',
      estimated: 'Оценочно',
      approx: 'примерно',
      calculated: 'расчёт',
      campusNote: 'Кампус',
      multiCampus: 'У университета несколько кампусов — на карте показан выбранный кампус.',

      secGallery: 'Галерея',
      galleryNote: 'Изображения показываются только из проверенных источников.',
      secMap: 'Карта кампуса',
      secDistance: 'До центра города',
      secHousing: 'Студенческое жильё',
      secCost: 'Стоимость жизни',
      secTuition: 'Стоимость обучения',
      secLife: 'Студенческая жизнь',
      secHistory: 'История университета',
      secTransport: 'Как добраться',
      secClimate: 'Климат',
      secSources: 'Источники',

      legUniversity: 'Университет', legCityCenter: 'Центр города', legDormitory: 'Общежитие',
      legLibrary: 'Библиотека', legBuilding: 'Учебный корпус', legSports: 'Спорткомплекс',
      legTransit: 'Общественный транспорт', legAirport: 'Аэропорт', legRail: 'Ж/д вокзал', legBusStation: 'Автовокзал',
      mapAttribution: 'Карта: © участники OpenStreetMap',

      distToCenter: 'Расстояние до центра города',
      straightLine: 'По прямой (формула гаверсинуса)',
      cityCenterRef: 'Точка центра',
      byCar: 'На машине',
      byTransit: 'Общественным транспортом',
      walking: 'Пешком',
      travelNote: 'Время — оценка: расстояние по прямой × 1,3 (дорожный коэффициент) и средняя городская скорость. Это не данные в реальном времени.',
      travelRouted: 'Время на машине получено из маршрута OSRM (OpenStreetMap), приблизительно. Общественный транспорт — оценка.',
      roadDistance: 'по дороге',

      roomType: 'Тип комнаты',
      distFromCampus: '{km} км от кампуса',
      facilities: 'Условия',
      fac_wifi: 'Wi-Fi', fac_laundry: 'Прачечная', fac_study_area: 'Учебная зона', fac_gym: 'Спортзал',
      fac_canteen: 'Столовая', fac_security: 'Охрана', fac_kitchen: 'Кухня', fac_parking: 'Парковка', fac_medical: 'Медпункт',
      monthlyEquiv: '≈ {price} / мес (расчёт: цена за {period} ÷ {div})',
      noHousing: 'Подтверждённых данных об общежитиях не найдено.',

      budgetTitle: 'Оценочный бюджет студента',
      cat_accommodation: 'Аренда жилья', cat_dormitory: 'Общежитие', cat_food: 'Питание', cat_transport: 'Транспорт',
      cat_mobile_internet: 'Связь / интернет', cat_personal: 'Личные расходы', cat_total: 'Итого (оценка)', cat_utilities: 'Коммунальные',
      sumNote: 'Сумма рассчитана из категорий выше; источник не публикует общий итог.',
      totalSourced: 'Итоговая сумма взята из источника.',
      noCost: 'Подтверждённых данных о стоимости жизни не найдено.',

      lvl_undergraduate: 'Бакалавриат', lvl_graduate: 'Магистратура', lvl_foundation: 'Подготовительный год', lvl_phd: 'Докторантура',
      aud_domestic: 'Граждане РК', aud_international: 'Иностранные студенты', aud_all: 'Все студенты',
      academicYear: 'Учебный год',
      tuitionNote: 'Стоимость зависит от программы — одна цена не применяется ко всем специальностям.',
      noTuition: 'Информацию о стоимости обучения не удалось надёжно подтвердить.',

      life_organizations: 'Студенческие организации', life_sports: 'Спорт', life_laboratories: 'Лаборатории', life_events: 'События',
      life_clubs: 'Клубы', life_facilities: 'Инфраструктура кампуса', life_study_spaces: 'Места для учёбы', life_dining: 'Питание', life_recreation: 'Отдых',
      noLife: 'Подтверждённых данных о студенческой жизни не найдено.',

      today: 'Сегодня',
      noHistory: 'Подтверждённых данных об истории не найдено.',

      tr_bus: 'Автобус', tr_metro: 'Метро', tr_lrt: 'LRT', tr_tram: 'Трамвай', tr_taxi: 'Такси', tr_airport: 'Аэропорт',
      tr_rail: 'Ж/д', tr_bus_station: 'Автовокзал', tr_bike: 'Велосипед',
      distanceTo: '{name}: ~{km} км по прямой, на машине ~{min} мин',
      transportApprox: 'Расстояния рассчитаны по координатам; реальное время в пути может отличаться.',
      noTransport: 'Подтверждённых данных о транспорте не найдено.',

      cl_avg_annual_temp: 'Средняя годовая температура', cl_avg_jan_temp: 'Январь (средняя)', cl_avg_jul_temp: 'Июль (средняя)',
      cl_annual_precipitation_mm: 'Осадки за год', cl_summary: 'Описание',
      liveClimate: 'Данные архива Open-Meteo за {year} год (координаты кампуса)',
      liveJan: 'Январь', liveJul: 'Июль', liveYear: 'Год', livePrecip: 'Осадки',
      climateUnavailable: 'Онлайн-данные о климате недоступны.',
      noClimate: 'Подтверждённых данных о климате не найдено.',

      conf_high: 'Высокая достоверность · официальный источник университета',
      conf_medium: 'Средняя достоверность · надёжный внешний источник',
      conf_low: 'Низкая достоверность · ограниченные данные',
      conf_estimate: 'Расчётная оценка',
      collected: 'Собрано: {date}',
      sourceDate: 'Дата источника: {date}',
      sourceDateUnknown: 'Дата источника недоступна',
      viewSource: 'Источник',
      evidence: 'Подтверждение',
      sourcesLead: 'Каждый факт на этой странице опирается на один из источников ниже.',
      freshnessNote: 'Цены и маршруты меняются. Данные, собранные в указанную дату, нельзя считать текущими ценами.',

      rateNote: '≈ примерно, курс {base}→{quote} {rate} ({date}, {source})',
      rateUnavailable: 'Курс валют недоступен',

      cmp_location: 'Расположение', cmp_distance: 'До центра', cmp_housing: 'Общежитие', cmp_tuition: 'Обучение',
      cmp_budget: 'Стоимость жизни', cmp_life: 'Студенческая жизнь', cmp_climate: 'Климат', cmp_transport: 'До аэропорта',
      cmp_founded: 'Основан', noData: 'нет данных'
    },

    en: {
      navGuide: 'Guide', navMap: 'Map', navQr: 'QR', navStudy: 'Study',
      skip: 'Skip to content',
      back: 'All universities',
      loading: 'Loading…',
      failed: 'Data failed to load. Check data/universities.json',
      notFound: 'This university is not in the database.',
      website: 'Official website',
      askGuide: 'Ask the guide',
      openProfile: 'Open profile',

      studyTitle: 'Universities',
      studyLead: 'Where a university is, what living in the city costs, dormitories, tuition and history — every fact with its source.',
      searchLabel: 'Search',
      searchPlaceholder: 'University or city name',
      noResults: 'Nothing found',
      countUniversities: '{n} universities',
      compareHint: 'Tick two universities to compare them',
      compareBtn: 'Compare',
      compareTitle: 'Compare universities',
      compareLead: 'Facts side by side. No ranking — you make the decision.',
      pickA: 'First university',
      pickB: 'Second university',
      noRank: 'This comparison does not declare either university “better”.',

      atGlance: 'At a glance',
      glLocation: 'Location',
      glCampus: 'Campus',
      glHousing: 'Housing',
      glBudget: 'Estimated student budget',
      glTuition: 'Tuition',
      glTransport: 'Transport',
      glFounded: 'Founded',
      kmFromCenter: '{km} km from city center',
      fromPrice: 'From {price}',
      perMonth: '/ month',
      perYear: '/ year',
      perSemester: '/ semester',
      perDay: '/ day',
      perCredit: '/ credit',
      perProgram: '/ program',
      perLevel: '/ level',
      programSpecific: 'program-specific',
      notVerified: 'not verified',
      minToCenter: '~{min} min to center',
      estimate: 'estimate',
      estimated: 'Estimated',
      approx: 'approx.',
      calculated: 'calculated',
      campusNote: 'Campus',
      multiCampus: 'The university has several campuses — the map shows the selected campus.',

      secGallery: 'Visual gallery',
      galleryNote: 'Images are shown only from verified sources.',
      secMap: 'Campus map',
      secDistance: 'Distance to city center',
      secHousing: 'Student housing',
      secCost: 'Cost of living',
      secTuition: 'Tuition',
      secLife: 'Student life',
      secHistory: 'University history',
      secTransport: 'Getting around',
      secClimate: 'Climate',
      secSources: 'Sources',

      legUniversity: 'University', legCityCenter: 'City center', legDormitory: 'Dormitory',
      legLibrary: 'Library', legBuilding: 'Campus building', legSports: 'Sports facility',
      legTransit: 'Public transport', legAirport: 'Airport', legRail: 'Railway station', legBusStation: 'Bus station',
      mapAttribution: 'Map: © OpenStreetMap contributors',

      distToCenter: 'Distance to city center',
      straightLine: 'Straight line (Haversine formula)',
      cityCenterRef: 'Center reference point',
      byCar: 'By car',
      byTransit: 'Public transport',
      walking: 'Walking',
      travelNote: 'Times are estimates: straight-line distance × 1.3 road factor at typical urban speeds. Not real-time data.',
      travelRouted: 'Car time from an OSRM (OpenStreetMap) route, approximate. Public transport is an estimate.',
      roadDistance: 'by road',

      roomType: 'Room type',
      distFromCampus: '{km} km from campus',
      facilities: 'Facilities',
      fac_wifi: 'Wi-Fi', fac_laundry: 'Laundry', fac_study_area: 'Study area', fac_gym: 'Gym',
      fac_canteen: 'Canteen', fac_security: 'Security', fac_kitchen: 'Kitchen', fac_parking: 'Parking', fac_medical: 'Medical point',
      monthlyEquiv: '≈ {price} / month (calculated: {period} price ÷ {div})',
      noHousing: 'No verified dormitory information was found.',

      budgetTitle: 'Estimated student budget',
      cat_accommodation: 'Accommodation (rent)', cat_dormitory: 'Dormitory', cat_food: 'Food', cat_transport: 'Transport',
      cat_mobile_internet: 'Mobile / internet', cat_personal: 'Personal expenses', cat_total: 'Estimated total', cat_utilities: 'Utilities',
      sumNote: 'Total calculated from the categories above; the source does not publish a total.',
      totalSourced: 'Total taken from the source.',
      noCost: 'No verified cost-of-living information was found.',

      lvl_undergraduate: 'Undergraduate', lvl_graduate: 'Graduate', lvl_foundation: 'Foundation year', lvl_phd: 'PhD',
      aud_domestic: 'Domestic students', aud_international: 'International students', aud_all: 'All students',
      academicYear: 'Academic year',
      tuitionNote: 'Tuition differs by program — one price does not apply to every program.',
      noTuition: 'Tuition information could not be reliably verified.',

      life_organizations: 'Student organizations', life_sports: 'Sports', life_laboratories: 'Laboratories', life_events: 'Events',
      life_clubs: 'Clubs', life_facilities: 'Campus facilities', life_study_spaces: 'Study spaces', life_dining: 'Dining', life_recreation: 'Recreation',
      noLife: 'No verified student-life information was found.',

      today: 'Today',
      noHistory: 'No verified history information was found.',

      tr_bus: 'Bus', tr_metro: 'Metro', tr_lrt: 'LRT', tr_tram: 'Tram', tr_taxi: 'Taxi', tr_airport: 'Airport',
      tr_rail: 'Railway', tr_bus_station: 'Bus station', tr_bike: 'Bicycle',
      distanceTo: '{name}: ~{km} km straight line, ~{min} min by car',
      transportApprox: 'Distances are calculated from coordinates; real travel times may differ.',
      noTransport: 'No verified transport information was found.',

      cl_avg_annual_temp: 'Average annual temperature', cl_avg_jan_temp: 'January (average)', cl_avg_jul_temp: 'July (average)',
      cl_annual_precipitation_mm: 'Annual precipitation', cl_summary: 'Summary',
      liveClimate: 'Open-Meteo archive data for {year} (campus coordinates)',
      liveJan: 'January', liveJul: 'July', liveYear: 'Year', livePrecip: 'Precipitation',
      climateUnavailable: 'Live climate data is unavailable.',
      noClimate: 'No verified climate information was found.',

      conf_high: 'High confidence · official university source',
      conf_medium: 'Medium confidence · reliable external source',
      conf_low: 'Low confidence · limited evidence',
      conf_estimate: 'Calculated estimate',
      collected: 'Collected {date}',
      sourceDate: 'Source date: {date}',
      sourceDateUnknown: 'Source date unavailable',
      viewSource: 'Source',
      evidence: 'Evidence',
      sourcesLead: 'Every fact on this page rests on one of the sources below.',
      freshnessNote: 'Prices and routes change. Data collected on the stated date must not be read as a current price.',

      rateNote: '≈ approximate, {base}→{quote} rate {rate} ({date}, {source})',
      rateUnavailable: 'Exchange rate unavailable',

      cmp_location: 'Location', cmp_distance: 'To city center', cmp_housing: 'Dormitory', cmp_tuition: 'Tuition',
      cmp_budget: 'Cost of living', cmp_life: 'Student life', cmp_climate: 'Climate', cmp_transport: 'To airport',
      cmp_founded: 'Founded', noData: 'no data'
    }
  };

  /* ------------------------------------------------------------------ language */

  let lang = readLang();

  function readLang() {
    const p = new URLSearchParams(location.search).get('lang');
    if (I18N[p]) return p;
    try {
      const s = localStorage.getItem(LANG_KEY);
      if (I18N[s]) return s;
    } catch (e) { /* private mode */ }
    return 'kk';
  }

  function setLang(next) {
    if (!I18N[next]) return;
    lang = next;
    document.documentElement.lang = lang;
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* ignore */ }

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      el.setAttribute('aria-label', t(el.dataset.i18nAria));
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      el.placeholder = t(el.dataset.i18nPlaceholder);
    });
    document.querySelectorAll('[data-lang]').forEach(function (btn) {
      const on = btn.dataset.lang === lang;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-pressed', String(on));
    });
    document.querySelectorAll('[data-page]').forEach(function (link) {
      link.href = withLang(link.dataset.page);
    });
  }

  function withLang(url) {
    const u = new URL(url, location.href);
    u.searchParams.set('lang', lang);
    return u.pathname.split('/').pop() + u.search;
  }

  function t(key, vars) {
    let text = (I18N[lang] || I18N.kk)[key];
    if (text == null) text = I18N.en[key] != null ? I18N.en[key] : key;
    Object.keys(vars || {}).forEach(function (k) {
      text = text.split('{' + k + '}').join(vars[k]);
    });
    return text;
  }

  /* Multilingual field: {kk, ru, en} → string with graceful fallback. */
  function pick(field) {
    if (field == null) return '';
    if (typeof field === 'string') return field;
    return field[lang] || field.en || field.ru || field.kk || '';
  }

  /* ------------------------------------------------------------------ geo */

  /* null / undefined / 0,0 are "no coordinates", never a point in the Gulf of Guinea. */
  function hasCoords(p) {
    return !!p && Number.isFinite(p.lat) && Number.isFinite(p.lng) && !(p.lat === 0 && p.lng === 0);
  }

  function haversineKm(a, b) {
    if (!a || !b || !hasCoords(a) || !hasCoords(b)) return null;
    const R = 6371.0088;
    const toRad = function (d) { return d * Math.PI / 180; };
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const s = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
  }

  /*
   * Travel-time estimates from a straight-line distance. Everything is an
   * explicit assumption so the UI can label it: road factor 1.3, car 25 km/h,
   * public transport 12–20 km/h plus waiting time, walking 4.8 km/h.
   */
  const SPEEDS = { roadFactor: 1.3, car: 25, transitFast: 20, transitSlow: 12, transitWait: 8, walk: 4.8 };

  function travelEstimates(km) {
    if (km == null) return null;
    const road = km * SPEEDS.roadFactor;
    return {
      roadKm: road,
      carMin: Math.max(3, Math.round(road / SPEEDS.car * 60)),
      transitMin: [
        Math.max(5, Math.round(road / SPEEDS.transitFast * 60 + SPEEDS.transitWait)),
        Math.max(8, Math.round(road / SPEEDS.transitSlow * 60 + SPEEDS.transitWait * 1.5))
      ],
      walkMin: Math.max(2, Math.round(road / SPEEDS.walk * 60)),
      routed: false
    };
  }

  /* Optional real routing via the public OSRM demo server. Fails softly. */
  function osrmRoute(from, to, profile) {
    const base = profile === 'foot'
      ? 'https://routing.openstreetmap.de/routed-foot/route/v1/foot/'
      : 'https://router.project-osrm.org/route/v1/driving/';
    const url = base + from.lng + ',' + from.lat + ';' + to.lng + ',' + to.lat + '?overview=false';
    const ctrl = new AbortController();
    const timer = setTimeout(function () { ctrl.abort(); }, 6000);
    return fetch(url, { signal: ctrl.signal })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        const r = data && data.routes && data.routes[0];
        if (!r || !isFinite(r.duration)) return null;
        return { minutes: Math.round(r.duration / 60), km: r.distance / 1000 };
      })
      .catch(function () { return null; })
      .finally(function () { clearTimeout(timer); });
  }

  /* ------------------------------------------------------------------ money */

  const SYMBOLS = { USD: '$', EUR: '€', KZT: '₸', RUB: '₽', GBP: '£', TRY: '₺' };

  function fmtNumber(n, digits) {
    if (n == null || !isFinite(n)) return '—';
    const d = digits == null ? (Math.abs(n) >= 100 ? 0 : 1) : digits;
    const localeMap = { kk: 'ru-RU', ru: 'ru-RU', en: 'en-US' };
    return Number(n).toLocaleString(localeMap[lang] || 'en-US', { maximumFractionDigits: d, minimumFractionDigits: 0 });
  }

  function fmtMoney(value, currency, digits) {
    if (value == null || !isFinite(value)) return '—';
    const sym = SYMBOLS[currency];
    const num = fmtNumber(value, digits == null ? 0 : digits);
    if (!sym) return num + ' ' + (currency || '');
    return currency === 'KZT' ? num + ' ' + sym : sym + num;
  }

  function periodLabel(period) {
    const key = { month: 'perMonth', year: 'perYear', semester: 'perSemester', day: 'perDay', credit: 'perCredit', program: 'perProgram', level: 'perLevel' }[period];
    return key ? t(key) : '/ ' + String(period || '');
  }

  /* Monthly equivalent of a semester / year price, with the divisor exposed. */
  const PERIOD_DIVISOR = { month: 1, semester: 5, year: 12, day: null, credit: null };

  function monthlyEquivalent(value, period) {
    const div = PERIOD_DIVISOR[period];
    if (!div || value == null) return null;
    return { value: value / div, divisor: div };
  }

  /* Exchange rates: live (open.er-api.com, no key) with a stored, dated fallback. */
  let ratesPromise = null;

  function loadRates() {
    if (ratesPromise) return ratesPromise;
    ratesPromise = fetch('data/rates.json')
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; })
      .then(function (stored) {
        const ctrl = new AbortController();
        const timer = setTimeout(function () { ctrl.abort(); }, 5000);
        return fetch('https://open.er-api.com/v6/latest/USD', { signal: ctrl.signal })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (live) {
            if (live && live.result === 'success' && live.rates && live.rates.KZT) {
              return {
                base: 'USD',
                rates: live.rates,
                date: (live.time_last_update_utc || '').slice(5, 16).trim() || new Date().toISOString().slice(0, 10),
                source: 'open.er-api.com',
                live: true
              };
            }
            return stored;
          })
          .catch(function () { return stored; })
          .finally(function () { clearTimeout(timer); });
      });
    return ratesPromise;
  }

  /* Convert to the "other" currency: KZT→USD, everything else→KZT. */
  function convert(value, currency, rates) {
    if (!rates || !rates.rates || value == null) return null;
    const target = currency === 'KZT' ? 'USD' : 'KZT';
    const from = currency === 'USD' ? 1 : rates.rates[currency];
    const to = target === 'USD' ? 1 : rates.rates[target];
    if (!from || !to) return null;
    const usd = value / from;
    return { value: usd * to, currency: target, rate: (to / from), base: currency, date: rates.date, source: rates.source };
  }

  /* ------------------------------------------------------------------ data */

  let dataPromise = null;

  function loadData() {
    if (!dataPromise) {
      dataPromise = fetch('data/universities.json').then(function (r) {
        if (!r.ok) throw new Error('universities.json HTTP ' + r.status);
        return r.json();
      });
    }
    return dataPromise;
  }

  function factOf(uni, id) {
    if (!id || !uni || !Array.isArray(uni.facts)) return null;
    return uni.facts.find(function (f) { return f.id === id; }) || null;
  }

  /* Like minBy, but only among the entries with the best confidence present. */
  const CONF_RANK = { high: 0, medium: 1, low: 2 };

  function bestConfident(uni, list, fn) {
    const scored = (list || []).map(function (item) {
      const f = factOf(uni, item.factId);
      return { item: item, rank: f && CONF_RANK[f.confidence] != null ? CONF_RANK[f.confidence] : 3 };
    }).filter(function (x) { const v = fn(x.item); return v != null && isFinite(v); });
    if (!scored.length) return null;
    const best = Math.min.apply(null, scored.map(function (x) { return x.rank; }));
    return minBy(scored.filter(function (x) { return x.rank === best; }).map(function (x) { return x.item; }), fn);
  }

  function minBy(list, fn) {
    let best = null;
    (list || []).forEach(function (item) {
      const v = fn(item);
      if (v == null || !isFinite(v)) return;
      if (best == null || v < best.v) best = { v: v, item: item };
    });
    return best;
  }

  /* ------------------------------------------------------------------ DOM helpers */

  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function fmtDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return String(iso);
    const localeMap = { kk: 'kk-KZ', ru: 'ru-RU', en: 'en-GB' };
    return d.toLocaleDateString(localeMap[lang] || 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  /* Provenance line: confidence badge + domain link + dates. */
  function sourceLine(fact, opts) {
    const wrap = el('div', 'prov');
    if (!fact) {
      wrap.appendChild(el('span', 'badge badge--estimate', t('conf_estimate')));
      return wrap;
    }
    const conf = ['high', 'medium', 'low'].indexOf(fact.confidence) >= 0 ? fact.confidence : 'low';
    wrap.appendChild(el('span', 'badge badge--' + conf, t('conf_' + conf)));

    if (fact.sourceUrl) {
      const a = el('a', 'prov__link', (fact.sourceDomain || fact.sourceUrl).replace(/^www\./, ''));
      a.href = fact.sourceUrl;
      a.target = '_blank';
      a.rel = 'noopener nofollow';
      a.title = fact.sourceTitle || fact.sourceUrl;
      wrap.appendChild(a);
    }

    const dates = el('span', 'prov__dates');
    dates.textContent = (fact.sourceDate ? t('sourceDate', { date: fact.sourceDate }) : t('sourceDateUnknown')) +
      ' · ' + t('collected', { date: fmtDate(fact.collectedAt) });
    wrap.appendChild(dates);

    if (opts && opts.evidence && Array.isArray(fact.evidence) && fact.evidence.length) {
      const q = el('details', 'prov__evidence');
      q.appendChild(el('summary', null, t('evidence')));
      fact.evidence.slice(0, 3).forEach(function (line) {
        q.appendChild(el('blockquote', null, line));
      });
      wrap.appendChild(q);
    }
    return wrap;
  }

  /* Price with original currency first and an approximate conversion after it. */
  function priceNode(value, currency, period, rates, opts) {
    const wrap = el('div', 'price');
    const main = el('span', 'price__main', fmtMoney(value, currency) + (period ? ' ' + periodLabel(period) : ''));
    wrap.appendChild(main);
    const conv = convert(value, currency, rates);
    if (conv) {
      const c = el('span', 'price__conv', '≈ ' + fmtMoney(conv.value, conv.currency) + (period ? ' ' + periodLabel(period) : ''));
      c.title = t('rateNote', { base: conv.base, quote: conv.currency, rate: fmtNumber(conv.rate, conv.rate < 1 ? 5 : 2), date: conv.date, source: conv.source });
      wrap.appendChild(c);
    }
    if (opts && opts.monthly) {
      const m = monthlyEquivalent(value, period);
      if (m && period !== 'month') {
        wrap.appendChild(el('span', 'price__equiv', t('monthlyEquiv', {
          price: fmtMoney(m.value, currency), period: periodLabel(period).replace('/ ', ''), div: m.divisor
        })));
      }
    }
    return wrap;
  }

  global.UniCore = {
    I18N: I18N,
    LANGS: LANGS,
    get lang() { return lang; },
    setLang: setLang,
    withLang: withLang,
    t: t,
    pick: pick,
    hasCoords: hasCoords,
    haversineKm: haversineKm,
    travelEstimates: travelEstimates,
    osrmRoute: osrmRoute,
    SPEEDS: SPEEDS,
    fmtNumber: fmtNumber,
    fmtMoney: fmtMoney,
    fmtDate: fmtDate,
    periodLabel: periodLabel,
    monthlyEquivalent: monthlyEquivalent,
    loadRates: loadRates,
    convert: convert,
    loadData: loadData,
    factOf: factOf,
    minBy: minBy,
    bestConfident: bestConfident,
    CONF_RANK: CONF_RANK,
    el: el,
    sourceLine: sourceLine,
    priceNode: priceNode
  };
})(window);
