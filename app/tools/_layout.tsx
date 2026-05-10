import { Stack } from 'expo-router';

export default function ToolsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#fff' },
        headerTintColor: '#111',
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
        headerBackTitle: 'Назад',
      }}
    >
      <Stack.Screen name="hudrz1" options={{ title: 'HUD без круга' }} />
      <Stack.Screen name="hudrz2" options={{ title: 'HUD с кругом' }} />
      <Stack.Screen name="map" options={{ title: 'Разрезать карту' }} />
      <Stack.Screen name="timecyc" options={{ title: 'Создать небо' }} />
      <Stack.Screen name="colorcyc" options={{ title: 'Создать вид' }} />
      <Stack.Screen name="weapon" options={{ title: 'Gun Editor' }} />
      <Stack.Screen name="hp" options={{ title: 'Иконки HP' }} />
      <Stack.Screen name="skin" options={{ title: 'Скины' }} />
      <Stack.Screen name="mod-dff" options={{ title: 'MOD → DFF' }} />
      <Stack.Screen name="dff-mod" options={{ title: 'DFF → MOD' }} />
      <Stack.Screen name="txd-png" options={{ title: 'TXD → PNG' }} />
      <Stack.Screen name="png-txd" options={{ title: 'PNG → TXD' }} />
      <Stack.Screen name="btx-png" options={{ title: 'BTX → KTX (ZIP)' }} />
      <Stack.Screen name="png-btx" options={{ title: 'KTX → BTX (ZIP)' }} />
    </Stack>
  );
}
