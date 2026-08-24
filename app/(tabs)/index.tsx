import { Button, ButtonText } from "@/components/ui/button";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";

export default function Home() {
  return (
    <VStack className="flex-1 items-center justify-center gap-4">
      <Text className="text-2xl font-bold rounded-full bg-slate-200 p-4">
        Gluestack funcionando!
      </Text>

      <Button>
        <ButtonText>Testar botão</ButtonText>
      </Button>
    </VStack>
  );
}