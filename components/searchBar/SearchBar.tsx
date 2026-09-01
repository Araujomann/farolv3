import React, { useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Search, X } from "lucide-react-native";
import { Box } from "../ui/box";
import { Input, InputField, InputIcon, InputSlot } from "../ui/input";

const ACTIVE_COLOR = "#0969D7";
const INACTIVE_COLOR = "#6B7280";
const PLACEHOLDER_COLOR = "#9CA3AF";

export const SearchBar = () => {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // No Gluestack uamos os tokens de classe ou as props data-* 
  // que ele configura internamente, mas mantemos as cores de estado pedidas
  const iconColor = isFocused || query.length > 0 ? ACTIVE_COLOR : INACTIVE_COLOR;
  // A borda dinâmica podemos controlar nas classes dinamicamente
  const borderClass = isFocused ? "border-[#0969D7]" : "border-[#E5E7EB]";

  const handleClear = () => {
    setQuery("");
  };

  return (
    <Box
      className="absolute left-4 right-4 z-10 shadow-none"
      style={{ top: insets.top + 12 }}
      pointerEvents="box-none"
    >
      <Input
        className={`flex-row items-center bg-white  border-[1.5px] px-1 py-1 h-16 shadow-lg rounded-full ${borderClass}`}
      >
        <InputSlot className="pl-3 pr-2">
          <InputIcon as={Search} size={20} color={iconColor}  />
        </InputSlot>

        <InputField
          value={query}
          onChangeText={setQuery}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Buscar lugar, rua ou bairro..."
          placeholderTextColor={PLACEHOLDER_COLOR}
          returnKeyType="search"
          className="flex-1 text-[15px] font-normal text-gray-900 "
        />

        {query.length > 0 && (
          <InputSlot className="pr-3 pl-2" onPress={handleClear}>
            <Box className="w-4.5 h-4.5 rounded-full bg-gray-500 justify-center items-center">
              <InputIcon as={X} size={11} color="#ffffff" />
            </Box>
          </InputSlot>
        )}
      </Input>
    </Box>
  );
};

// Sombras no React Native ainda requerem estilos base caso o className
// não processe bem sombras elegantes iguais as do seu layout
const styles = StyleSheet.create({
  shadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
    minHeight: 52, // pra alinhar com 'h-30' tailwind
  },
});
