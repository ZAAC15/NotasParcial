# Notas al día

Hice esta app como proyecto práctico con React Native y Expo. Sirve para guardar notas, fotos y grabaciones de voz desde el celular.

## Qué tiene

- Pestañas para Notas, Cámara y Audio.
- Notas con fecha y hora.
- Fotos tomadas con la cámara o seleccionadas de la galería.
- Grabación y reproducción de notas de voz.
- Los datos se guardan en el dispositivo.

## Para abrir el proyecto

```bash
npm install
npx expo start
```

Para generar el APK de Android con EAS:

```bash
npx eas-cli build --platform android --profile preview
```
