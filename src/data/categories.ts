export interface Tool {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface Category {
  id: string;
  title: string;
  description: string;
  icon: string;
  tools: Tool[];
}

export const CATEGORIES: Category[] = [
  {
    id: 'hud',
    title: 'HUD',
    description: 'Разрезать HUD изображение',
    icon: 'layers-outline',
    tools: [
      { id: 'hudrz1', title: 'Без круга', description: 'Разрезать HUD без вырезанного круга', icon: 'cut-outline' },
      { id: 'hudrz2', title: 'С кругом', description: 'Разрезать HUD с вырезанным кругом', icon: 'radio-button-on-outline' },
    ],
  },
  {
    id: 'map',
    title: 'Карта',
    description: 'Разрезать карту на тайлы',
    icon: 'map-outline',
    tools: [
      { id: 'map', title: 'Разрезать карту', description: 'Делит карту на 196 тайлов (14×14)', icon: 'grid-outline' },
    ],
  },
  {
    id: 'sky',
    title: 'Небо и Вид',
    description: 'Создание неба и цвета вида',
    icon: 'partly-sunny-outline',
    tools: [
      { id: 'timecyc', title: 'Создать небо', description: 'Генерация timecyc.json по 4 цветам', icon: 'color-palette-outline' },
      { id: 'colorcyc', title: 'Создать вид', description: 'Генерация colorcycle.dat по 1 цвету', icon: 'eye-outline' },
    ],
  },
  {
    id: 'weapon',
    title: 'Оружие',
    description: 'Редактор параметров оружия',
    icon: 'git-compare-outline',
    tools: [
      { id: 'weapon', title: 'Gun Editor', description: 'Настройка weapon.dat (PT и разброс)', icon: 'settings-outline' },
    ],
  },
  {
    id: 'icons',
    title: 'Иконки HP',
    description: 'Покраска HP иконок',
    icon: 'heart-outline',
    tools: [
      { id: 'hp', title: 'Покрасить иконки', description: 'Покраска HP, брони, рублей в ZIP', icon: 'color-filter-outline' },
    ],
  },
  {
    id: 'skins',
    title: 'Скины',
    description: 'Получить скин по номеру',
    icon: 'person-outline',
    tools: [
      { id: 'skin', title: 'Получить скин', description: '50 готовых скинов для GTA SA Mobile', icon: 'archive-outline' },
    ],
  },
  {
    id: 'dff',
    title: 'DFF / MOD',
    description: 'Конвертация DFF и MOD файлов',
    icon: 'swap-horizontal-outline',
    tools: [
      { id: 'mod-dff', title: 'MOD → DFF', description: 'Расшифровать MOD в DFF', icon: 'arrow-forward-outline' },
      { id: 'dff-mod', title: 'DFF → MOD', description: 'Зашифровать DFF в MOD', icon: 'arrow-back-outline' },
    ],
  },
  {
    id: 'txd',
    title: 'TXD / PNG',
    description: 'Конвертация TXD и PNG',
    icon: 'image-outline',
    tools: [
      { id: 'txd-png', title: 'TXD → PNG', description: 'Извлечь PNG текстуры из TXD (ZIP)', icon: 'download-outline' },
      { id: 'png-txd', title: 'PNG → TXD', description: 'Создать TXD из PNG файла', icon: 'upload-outline' },
    ],
  },
  {
    id: 'btx',
    title: 'BTX / PNG',
    description: 'Конвертация BTX и PNG в ZIP',
    icon: 'document-outline',
    tools: [
      { id: 'btx-png', title: 'BTX → PNG (ZIP)', description: 'Конвертировать ZIP с BTX файлами', icon: 'download-outline' },
      { id: 'png-btx', title: 'PNG → BTX (ZIP)', description: 'Конвертировать ZIP с PNG файлами', icon: 'upload-outline' },
    ],
  },
];
