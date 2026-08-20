import { Button, YStack, Text } from 'tamagui'

export default function Home() {
  return (
    <YStack flex={1} alignItems="center" justifyContent="center" gap="$4">
      <Text fontSize="$8">Tamagui funcionando 🎉</Text>
      <Button theme="blue" onPress={() => alert('Beleza!')}>
        Testar botão
      </Button>
    </YStack>
  )
}