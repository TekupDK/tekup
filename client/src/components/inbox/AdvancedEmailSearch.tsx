import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ChevronRight, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface SearchOperator {
  key: string;
  label: string;
  description: string;
  placeholder: string;
  examples: string[];
}

const SEARCH_OPERATORS: SearchOperator[] = [
  {
    key: "is:",
    label: "is:",
    description: "Status (Sent, unread, draft, trash, spam, etc.)",
    placeholder: "e.g. unread, sent, draft",
    examples: ["unread", "sent", "draft", "starred", "trash"],
  },
  {
    key: "from:",
    label: "from:",
    description: "Afsender",
    placeholder: "e.g. lars@example.com",
    examples: [],
  },
  {
    key: "to:",
    label: "to:",
    description: "Modtager",
    placeholder: "e.g. info@rendetalje.dk",
    examples: [],
  },
  {
    key: "subject:",
    label: "subject:",
    description: "Søg efter ord i emnelinjen",
    placeholder: "e.g. faktura, opfølgning",
    examples: [],
  },
  {
    key: "label:",
    label: "label:",
    description: "E-mails med en bestemt etiket",
    placeholder: "e.g. Important, Work",
    examples: [],
  },
  {
    key: "has:",
    label: "has:",
    description: "E-mails med vedhæftede filer eller links",
    placeholder: "e.g. attachment, link",
    examples: ["attachment", "link", "drive"],
  },
  {
    key: "filename:",
    label: "filename:",
    description: "Søg efter vedhæftede filer efter navn eller type",
    placeholder: "e.g. invoice.pdf, .xlsx",
    examples: [],
  },
  {
    key: "before:",
    label: "before:",
    description: "E-mails før en bestemt dato",
    placeholder: "e.g. 2024/10/01",
    examples: ["2024/10/01", "2024-10-01"],
  },
  {
    key: "after:",
    label: "after:",
    description: "E-mails efter en bestemt dato",
    placeholder: "e.g. 2024/10/01",
    examples: ["2024/10/01", "2024-10-01"],
  },
  {
    key: "cc:",
    label: "cc:",
    description: "Angiv en modtager, der har modtaget en kopi",
    placeholder: "e.g. lars@example.com",
    examples: [],
  },
  {
    key: "bcc:",
    label: "bcc:",
    description: "Angiv en modtager, der har modtaget en blind kopi",
    placeholder: "e.g. lars@example.com",
    examples: [],
  },
];

interface AdvancedEmailSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  placeholder?: string;
  className?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export default function AdvancedEmailSearch({
  value,
  onChange,
  onSearch,
  placeholder = "Søg emails, kontakter, labels...",
  className,
  inputRef: externalInputRef,
}: AdvancedEmailSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeOperator, setActiveOperator] = useState<SearchOperator | null>(
    null
  );
  const [operatorValue, setOperatorValue] = useState("");
  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef || internalInputRef;
  const [cursorPosition, setCursorPosition] = useState(0);

  // Detect if user is typing an operator
  useEffect(() => {
    if (!isOpen && value) {
      const parts = value.split(" ");
      const lastPart = parts[parts.length - 1];
      const operator = SEARCH_OPERATORS.find(op =>
        lastPart.toLowerCase().startsWith(op.key.toLowerCase())
      );
      if (operator) {
        setActiveOperator(operator);
        setOperatorValue(lastPart.substring(operator.key.length));
        setIsOpen(true);
      }
    }
  }, [value, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setCursorPosition(e.target.selectionStart || 0);

    // Check if typing an operator
    const parts = newValue.split(" ");
    const lastPart = parts[parts.length - 1];
    const operator = SEARCH_OPERATORS.find(op =>
      lastPart.toLowerCase().startsWith(op.key.toLowerCase())
    );

    if (operator) {
      setActiveOperator(operator);
      setOperatorValue(lastPart.substring(operator.key.length));
      setIsOpen(true);
    } else {
      setActiveOperator(null);
      setOperatorValue("");
      if (isOpen && !newValue) {
        setIsOpen(false);
      }
    }
  };

  const handleOperatorSelect = (operator: SearchOperator) => {
    const parts = value.split(" ");
    parts.pop(); // Remove last part if incomplete
    const newQuery =
      (parts.length > 0 ? parts.join(" ") + " " : "") + operator.key;
    onChange(newQuery);
    setActiveOperator(operator);
    setOperatorValue("");
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleOperatorValueChange = (newValue: string) => {
    setOperatorValue(newValue);
    const parts = value.split(" ");
    parts.pop(); // Remove last part
    const updatedQuery =
      (parts.length > 0 ? parts.join(" ") + " " : "") +
      (activeOperator?.key || "") +
      newValue;
    onChange(updatedQuery);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSearch();
      setIsOpen(false);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setActiveOperator(null);
      setOperatorValue("");
    }
  };

  const clearSearch = () => {
    onChange("");
    setIsOpen(false);
    setActiveOperator(null);
    setOperatorValue("");
    inputRef.current?.focus();
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn("relative flex-1 min-w-0", className)}>
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
        <PopoverTrigger asChild>
          <Input
            ref={inputRef}
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onClick={() => setIsOpen(true)}
            placeholder={placeholder}
            className="pl-10 pr-8 w-full"
          />
        </PopoverTrigger>
        {value && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
            onClick={clearSearch}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      <PopoverContent
        className="w-[400px] p-0"
        align="start"
        onOpenAutoFocus={e => e.preventDefault()}
      >
        {activeOperator ? (
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-semibold text-primary">
                    {activeOperator.label}
                  </code>
                  <span className="text-xs text-muted-foreground">
                    {activeOperator.description}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setActiveOperator(null);
                  setOperatorValue("");
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
            <Input
              value={operatorValue}
              onChange={e => handleOperatorValueChange(e.target.value)}
              placeholder={activeOperator.placeholder}
              className="mb-2"
              autoFocus
              onKeyDown={e => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onSearch();
                  setIsOpen(false);
                }
              }}
            />
            {activeOperator.examples.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground mb-1">Eksempler:</p>
                <div className="flex flex-wrap gap-1">
                  {activeOperator.examples.map((example, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      className="text-xs h-6"
                      onClick={() => {
                        handleOperatorValueChange(example);
                        onSearch();
                        setIsOpen(false);
                      }}
                    >
                      {example}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-2">
            <div className="mb-2 px-2 py-1">
              <p className="text-xs font-semibold text-muted-foreground mb-1">
                Avanceret søgning
              </p>
              <p className="text-xs text-muted-foreground">
                Brug operators til præcis søgning
              </p>
            </div>
            <div className="space-y-1 max-h-[300px] overflow-y-auto">
              {SEARCH_OPERATORS.map(operator => (
                <button
                  key={operator.key}
                  className="w-full flex items-center justify-between p-2 hover:bg-accent rounded-md text-left transition-colors group"
                  onClick={() => handleOperatorSelect(operator)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-semibold text-primary">
                        {operator.label}
                      </code>
                      <span className="text-xs text-muted-foreground truncate">
                        {operator.description}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
