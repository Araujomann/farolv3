import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Building2, Eraser, MapPin, Search } from "lucide-react-native";
import { Box } from "../ui/box";
import { Input, InputField, InputIcon, InputSlot } from "../ui/input";
import {
  createMapboxSessionToken,
  retrieveMapPlace,
  searchMapPlaces,
  type MapPlaceSearchResult,
  type MapPlaceSearchSuggestion,
} from "@/src/features/map/services/placeSearch";

const ACTIVE_COLOR = "#0969D7";
const INACTIVE_COLOR = "#6B7280";
const PLACEHOLDER_COLOR = "#9CA3AF";
const CATEGORY_ICONS = {
  Estabelecimento: Building2,
  Rua: MapPin,
} as const;

type SearchBarProps = {
  onSelectPlace: (place: MapPlaceSearchResult) => void;
  onSuggestionsHeightChange: (height: number) => void;
};

export const SearchBar = ({
  onSelectPlace,
  onSuggestionsHeightChange,
}: SearchBarProps) => {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [results, setResults] = useState<MapPlaceSearchSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchImmediately, setSearchImmediately] = useState(0);
  const [selectingPlaceId, setSelectingPlaceId] = useState<string | null>(null);
  const submitSearch = useRef(false);
  const sessionToken = useRef(createMapboxSessionToken());
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestId = useRef(0);
  const suggestionsHeight = useRef(0);
  const showSuggestions =
    (isFocused && query.trim().length >= 2) || selectingPlaceId !== null;

  const reportSuggestionsHeight = useCallback(
    (height: number) => {
      if (suggestionsHeight.current === height) return;
      suggestionsHeight.current = height;
      onSuggestionsHeightChange(height);
    },
    [onSuggestionsHeightChange],
  );

  useEffect(
    () => () => {
      if (blurTimeout.current) {
        clearTimeout(blurTimeout.current);
      }
      onSuggestionsHeightChange(0);
    },
    [onSuggestionsHeightChange],
  );

  useEffect(() => {
    if (!showSuggestions) {
      reportSuggestionsHeight(0);
    }
  }, [reportSuggestionsHeight, showSuggestions]);

  useEffect(() => {
    const normalizedQuery = query.trim();

    if (!isFocused || normalizedQuery.length < 2) {
      setResults([]);
      setIsSearching(false);
      setSearchError(null);
      setHasSearched(false);
      return;
    }

    const currentRequestId = ++requestId.current;
    const controller = new AbortController();
    const delay = submitSearch.current ? 0 : 350;
    submitSearch.current = false;
    const timeout = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);

      try {
        const places = await searchMapPlaces(
          normalizedQuery,
          sessionToken.current,
          controller.signal,
        );
        if (requestId.current === currentRequestId) {
          setResults(places);
          setHasSearched(true);
        }
      } catch (error) {
        if (controller.signal.aborted) return;

        if (__DEV__) {
          console.warn("Falha ao buscar lugares no mapa", error);
        }

        if (requestId.current === currentRequestId) {
          setResults([]);
          setSearchError(
            "Não foi possível buscar lugares. Verifique sua conexão e tente novamente.",
          );
          setHasSearched(true);
        }
      } finally {
        if (requestId.current === currentRequestId) {
          setIsSearching(false);
        }
      }
    }, delay);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [isFocused, query, searchImmediately]);

  const iconColor =
    isFocused || query.length > 0 ? ACTIVE_COLOR : INACTIVE_COLOR;
  const borderClass = isFocused ? "border-[#0969D7]" : "border-[#E5E7EB]";

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setIsSearching(false);
    setSearchError(null);
    setHasSearched(false);
  };

  const handleSelectPlace = async (place: MapPlaceSearchSuggestion) => {
    if (selectingPlaceId) return;
    if (blurTimeout.current) {
      clearTimeout(blurTimeout.current);
      blurTimeout.current = null;
    }
    setSelectingPlaceId(place.id);
    setSearchError(null);
    Keyboard.dismiss();

    try {
      const selectedPlace = await retrieveMapPlace(place);
      onSelectPlace(selectedPlace);
      setQuery(selectedPlace.name);
      setResults([]);
      setHasSearched(false);
      sessionToken.current = createMapboxSessionToken();
      setIsFocused(false);
    } catch (error) {
      if (__DEV__) {
        console.warn("Falha ao localizar resultado no mapa", error);
      }

      setSearchError(
        "Não foi possível abrir esse lugar no mapa. Tente outra sugestão.",
      );
      setIsFocused(true);
    } finally {
      setSelectingPlaceId(null);
    }
  };

  return (
    <Box
      className="absolute left-4 right-4 z-10 shadow-none"
      style={{ top: insets.top + 12 }}
      pointerEvents="box-none"
    >
      <Input
        className={`flex-row items-center bg-white border-[1.5px] px-1 py-1 h-16 shadow-lg rounded-full ${borderClass}`}
      >
        <InputSlot className="pl-3 pr-2">
          <InputIcon as={Search} size={20} color={iconColor} />
        </InputSlot>

        <InputField
          value={query}
          onChangeText={(value) => {
            setQuery(value);
            setResults([]);
            setIsSearching(false);
            setSearchError(null);
            setHasSearched(false);
          }}
          onFocus={() => {
            if (blurTimeout.current) {
              clearTimeout(blurTimeout.current);
              blurTimeout.current = null;
            }
            setIsFocused(true);
          }}
          onBlur={() => {
            blurTimeout.current = setTimeout(() => {
              setIsFocused(false);
              blurTimeout.current = null;
            }, 200);
          }}
          blurOnSubmit={false}
          onSubmitEditing={() => {
            submitSearch.current = true;
            setSearchImmediately((current) => current + 1);
          }}
          placeholder="Buscar lugar, rua ou bairro..."
          placeholderTextColor={PLACEHOLDER_COLOR}
          returnKeyType="search"
          className="flex-1 text-[15px] font-normal text-gray-900"
        />

        {query.length > 0 && (
          <InputSlot
            accessibilityRole="button"
            accessibilityLabel="Limpar busca"
            className="mr-2 h-9 w-9 rounded-full border border-gray-200 bg-gray-50"
            onPress={handleClear}
          >
            <InputIcon as={Eraser} size={16} color={INACTIVE_COLOR} />
          </InputSlot>
        )}
      </Input>

      {showSuggestions && (
        <View
          onLayout={(event) =>
            reportSuggestionsHeight(event.nativeEvent.layout.height)
          }
          className="mt-2 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl"
        >
          <View className="flex-row items-center justify-between border-b border-gray-100 px-4 py-3">
            <View className="flex-row items-center">
              <MapPin size={15} color={ACTIVE_COLOR} />
              <Text className="ml-2 text-xs font-bold uppercase tracking-wider text-gray-600">
                Lugares em Imperatriz
              </Text>
            </View>
            {isSearching || selectingPlaceId ? (
              <ActivityIndicator size="small" color={ACTIVE_COLOR} />
            ) : results.length > 0 ? (
              <Text className="text-xs font-medium text-gray-400">
                {results.length}{" "}
                {results.length === 1 ? "resultado" : "resultados"}
              </Text>
            ) : null}
          </View>

          {selectingPlaceId && (
            <View className="px-4 py-4">
              <Text className="text-sm text-gray-600">
                Abrindo lugar no mapa...
              </Text>
            </View>
          )}

          {searchError && (
            <Text className="px-4 py-4 text-sm text-red-600">
              {searchError}
            </Text>
          )}

          {!isSearching &&
            !selectingPlaceId &&
            !searchError &&
            hasSearched &&
            results.length === 0 && (
              <Text className="px-4 py-4 text-sm leading-5 text-gray-500">
                Nenhum bairro ou local conhecido encontrado. Tente outro nome.
              </Text>
            )}

          {!isSearching && !selectingPlaceId && results.length > 0 && (
            <ScrollView
              className="max-h-72"
              keyboardShouldPersistTaps="always"
              showsVerticalScrollIndicator={results.length > 4}
            >
              {results.map((place) => {
                const CategoryIcon = CATEGORY_ICONS[place.category];

                return (
                  <Pressable
                    key={place.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Buscar ${place.name}, ${place.category}, em ${place.placeName}`}
                    onPress={() => void handleSelectPlace(place)}
                    disabled={selectingPlaceId !== null}
                    className="flex-row items-center border-b border-gray-50 px-4 py-3.5"
                  >
                    <View className="h-10 w-10 items-center justify-center rounded-2xl bg-blue-50">
                      <CategoryIcon size={18} color={ACTIVE_COLOR} />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text
                        numberOfLines={1}
                        className="text-sm font-semibold text-gray-900"
                      >
                        {place.name}
                      </Text>
                      <Text
                        numberOfLines={1}
                        className="mt-1 text-xs text-gray-500"
                      >
                        {place.placeName}
                      </Text>
                    </View>
                    <View className="ml-2 rounded-full bg-gray-100 px-2.5 py-1">
                      <Text className="text-[10px] font-semibold text-gray-600">
                        {place.category}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>
      )}
    </Box>
  );
};
