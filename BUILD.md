# ConvR — Сборка APK через EAS (Expo Application Services)

Сборка идёт **в облаке Expo** — Android SDK и Java не нужны локально.

---

## Способ 1 — Через Termux (Android)

### Шаг 1 — Установить пакеты

```bash
pkg update && pkg upgrade -y
pkg install -y nodejs-lts git
npm install -g npm@latest
npm install -g eas-cli
```

### Шаг 2 — Распаковать архив

```bash
# Скопируйте convr-fixed.zip в Termux (через файловый менеджер → Downloads):
cp /sdcard/Download/convr-fixed.zip ~/
cd ~
python3 -m zipfile -e convr-fixed.zip .
cd convr-fixed
```

### Шаг 3 — Установить зависимости

```bash
npm install --legacy-peer-deps
```

### Шаг 4 — Войти в Expo аккаунт

Зарегистрируйтесь на **expo.dev** (бесплатно), затем:

```bash
eas login
```

### Шаг 5 — Собрать APK

```bash
eas build --platform android --profile preview
```

- "Create EAS project?" → **Y**
- "Generate new keystore?" → **Y**

Сборка займёт 5–15 минут. По завершении получите прямую ссылку на APK.

---

## Способ 2 — Через компьютер (Windows/Mac/Linux)

### Шаг 1 — Установить Node.js

Скачайте с https://nodejs.org (версия 20 LTS)

### Шаг 2 — Установить EAS CLI

```bash
npm install -g eas-cli
```

### Шаг 3 — Распаковать архив и установить зависимости

```bash
# Распакуйте convr-fixed.zip в удобную папку, затем:
cd convr-fixed
npm install --legacy-peer-deps
```

### Шаг 4 — Войти и собрать

```bash
eas login
eas build --platform android --profile preview
```

---

## Частые ошибки

| Ошибка | Решение |
|---|---|
| `command not found: eas` | `npm install -g eas-cli` ещё раз |
| `ENOMEM` при install | Добавьте `--legacy-peer-deps` |
| `error: spawn ENOENT` | Установите git: `pkg install git` (Termux) |
| Ошибка `catalog:` | Используйте только этот исправленный архив |

---

**Бесплатный лимит:** 30 сборок в месяц на expo.dev.

После сборки вы получите ссылку вида:
`https://expo.dev/artifacts/eas/xxxx.apk`
