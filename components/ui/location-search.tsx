"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface LocationSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  place_id: string;
  class: string;
  type: string;
  importance: number;
}

interface LocationSearchProps {
  onLocationSelect: (location: { lat: number; lng: number; label: string }) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  variant?: "default" | "dark";
}

export function LocationSearch({
  onLocationSelect,
  placeholder = "Cari lokasi...",
  className,
  disabled = false,
  variant = "default"
}: LocationSearchProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce logic: update debouncedQuery after 500ms of inactivity
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  // Fetch location suggestions from Nominatim API when debouncedQuery changes
  useEffect(() => {
    const fetchSuggestions = async (searchQuery: string): Promise<void> => {
      if (searchQuery.length < 3) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&countrycodes=id`,
          {
            headers: {
              'User-Agent': 'ambilidis-app'
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch location suggestions');
        }

        const data: LocationSuggestion[] = await response.json();
        setSuggestions(data);
        if (data.length > 0) {
          setIsOpen(true);
        }
      } catch (error) {
        console.error('Error fetching location suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (debouncedQuery.length >= 3) {
      fetchSuggestions(debouncedQuery);
    } else {
      setTimeout(() => {
        setSuggestions([]);
        setIsOpen(false);
      }, 0);
    }
  }, [debouncedQuery]);

  const handleSelectLocation = (suggestion: LocationSuggestion) => {
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);

    const location = {
      lat,
      lng,
      label: suggestion.display_name.split(',')[0]
    };

    setSelectedLocation(suggestion.display_name);
    setQuery(suggestion.display_name);
    setIsOpen(false);
    onLocationSelect(location);
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    setSelectedLocation("");
  };

  return (
    <div className={cn("relative w-full", className)}>
      <Popover open={isOpen && suggestions.length > 0} onOpenChange={setIsOpen} modal={false}>
        <div ref={containerRef} className="relative w-full">
          <Search className={cn(
            "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4",
            variant === "dark" ? "text-white/60" : "text-muted-foreground"
          )} />
          <Input
            placeholder={placeholder}
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            className={cn(
              "pl-10 pr-10",
              variant === "dark"
                ? "bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-white/30"
                : "bg-white"
            )}
            disabled={disabled}
          />
          {isLoading && (
            <Loader2 className={cn(
              "absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin",
              variant === "dark" ? "text-white/60" : "text-muted-foreground"
            )} />
          )}
          {!isLoading && selectedLocation && (
            <MapPin className={cn(
              "absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4",
              variant === "dark" ? "text-white" : "text-green-500"
            )} />
          )}
        </div>
        <PopoverContent
          anchor={containerRef}
          className="w-full p-0"
          align="start"
          initialFocus={false}
        >
          <Command>
            <CommandList>
              {suggestions.length === 0 && !isLoading && query.length >= 3 && (
                <CommandEmpty>Tidak ada lokasi ditemukan</CommandEmpty>
              )}
              {suggestions.map((suggestion) => (
                <CommandItem
                  key={suggestion.place_id}
                  onSelect={() => handleSelectLocation(suggestion)}
                  className="cursor-pointer"
                >
                  <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {suggestion.display_name.split(',')[0]}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {suggestion.display_name.split(',').slice(1).join(',').trim()}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
