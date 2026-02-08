"use client";

import { ElicitationUI } from "@/components/tambo/elicitation-ui";
import {
  McpPromptButton,
  McpResourceButton,
} from "@/components/tambo/mcp-components";
import { McpConfigModal } from "./mcp-config-modal";
import {
  Tooltip,
  TooltipProvider,
} from "@/components/tambo/message-suggestions";
import { cn } from "@/lib/utils";
import {
  useIsTamboTokenUpdating,
  useTamboThread,
  useTamboThreadInput,
  type StagedImage,
} from "@tambo-ai/react";
import {
  useTamboElicitationContext,
  useTamboMcpPrompt,
  useTamboMcpPromptList,
  useTamboMcpResourceList,
  type TamboElicitationRequest,
  type TamboElicitationResponse,
} from "@tambo-ai/react/mcp";
import { cva, type VariantProps } from "class-variance-authority";
import {
  ArrowUp,
  AtSign,
  FileText,
  Image as ImageIcon,
  Paperclip,
  Square,
  X,
} from "lucide-react";
import * as React from "react";
import { useDebounce } from "use-debounce";
import {
  getImageItems,
  TextEditor,
  type PromptItem,
  type ResourceItem,
  type TamboEditor,
} from "./text-editor";



const LazyDictationButton = React.lazy(() => import("./dictation-button"));


const DictationButton = () => {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <React.Suspense fallback={null}>
      <LazyDictationButton />
    </React.Suspense>
  );
};


export interface ResourceProvider {
  
  search(query: string): Promise<ResourceItem[]>;
}


export interface PromptProvider {
  
  search(query: string): Promise<PromptItem[]>;
  
  get(id: string): Promise<PromptItem>;
}


const dedupeResourceItems = (resourceItems: ResourceItem[]) => {
  const seen = new Set<string>();
  return resourceItems.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};


const filterResourceItems = (
  resourceItems: ResourceItem[],
  query: string,
): ResourceItem[] => {
  if (query === "") return resourceItems;

  const normalizedQuery = query.toLocaleLowerCase();
  return resourceItems.filter((item) =>
    item.name.toLocaleLowerCase().includes(normalizedQuery),
  );
};


const filterPromptItems = (
  promptItems: PromptItem[],
  query: string,
): PromptItem[] => {
  if (query === "") return promptItems;

  const normalizedQuery = query.toLocaleLowerCase();
  return promptItems.filter((item) =>
    item.name.toLocaleLowerCase().includes(normalizedQuery),
  );
};

const EXTERNAL_SEARCH_DEBOUNCE_MS = 200;


function useCombinedResourceList(
  externalProvider: ResourceProvider | undefined,
  search: string,
): ResourceItem[] {
  const { data: mcpResources } = useTamboMcpResourceList(search);
  const [debouncedSearch] = useDebounce(search, EXTERNAL_SEARCH_DEBOUNCE_MS);

  
  const mcpItems: ResourceItem[] = React.useMemo(
    () =>
      mcpResources
        ? (
            mcpResources as {
              resource: { uri: string; name?: string };
            }[]
          ).map((entry) => ({
            
            
            id: entry.resource.uri,
            name: entry.resource.name ?? entry.resource.uri,
            icon: React.createElement(AtSign, { className: "w-4 h-4" }),
            componentData: { type: "mcp-resource", data: entry },
          }))
        : [],
    [mcpResources],
  );

  
  const [externalItems, setExternalItems] = React.useState<ResourceItem[]>([]);

  
  React.useEffect(() => {
    if (!externalProvider) {
      setExternalItems([]);
      return;
    }

    let cancelled = false;
    externalProvider
      .search(debouncedSearch)
      .then((items) => {
        if (!cancelled) {
          setExternalItems(items);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch external resources", error);
        if (!cancelled) {
          setExternalItems([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [externalProvider, debouncedSearch]);

  
  
  const combined = React.useMemo(() => {
    const filteredExternal = filterResourceItems(externalItems, search);
    return dedupeResourceItems([...mcpItems, ...filteredExternal]);
  }, [mcpItems, externalItems, search]);

  return combined;
}


function useCombinedPromptList(
  externalProvider: PromptProvider | undefined,
  search: string,
): PromptItem[] {
  
  const { data: mcpPrompts } = useTamboMcpPromptList(search);
  const [debouncedSearch] = useDebounce(search, EXTERNAL_SEARCH_DEBOUNCE_MS);

  
  const mcpItems: PromptItem[] = React.useMemo(
    () =>
      mcpPrompts
        ? (mcpPrompts as { prompt: { name: string } }[]).map((entry) => ({
            id: `mcp-prompt:${entry.prompt.name}`,
            name: entry.prompt.name,
            icon: React.createElement(FileText, { className: "w-4 h-4" }),
            text: "", 
          }))
        : [],
    [mcpPrompts],
  );

  
  const [externalItems, setExternalItems] = React.useState<PromptItem[]>([]);

  
  React.useEffect(() => {
    if (!externalProvider) {
      setExternalItems([]);
      return;
    }

    let cancelled = false;
    externalProvider
      .search(debouncedSearch)
      .then((items) => {
        if (!cancelled) {
          setExternalItems(items);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch external prompts", error);
        if (!cancelled) {
          setExternalItems([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [externalProvider, debouncedSearch]);

  
  
  const combined = React.useMemo(() => {
    const filteredExternal = filterPromptItems(externalItems, search);
    return [...mcpItems, ...filteredExternal];
  }, [mcpItems, externalItems, search]);

  return combined;
}


const messageInputVariants = cva("w-full", {
  variants: {
    variant: {
      default: "",
      solid: [
        "[&>div]:bg-background",
        "[&>div]:border-0",
        "[&>div]:shadow-xl [&>div]:shadow-black/5 [&>div]:dark:shadow-black/20",
        "[&>div]:ring-1 [&>div]:ring-black/5 [&>div]:dark:ring-white/10",
        "[&_textarea]:bg-transparent",
        "[&_textarea]:rounded-lg",
      ].join(" "),
      bordered: [
        "[&>div]:bg-transparent",
        "[&>div]:border-2 [&>div]:border-gray-300 [&>div]:dark:border-zinc-600",
        "[&>div]:shadow-none",
        "[&_textarea]:bg-transparent",
        "[&_textarea]:border-0",
      ].join(" "),
    },
  },
  defaultVariants: {
    variant: "default",
  },
});


interface MessageInputContextValue {
  value: string;
  setValue: (value: string) => void;
  submit: (options: {
    streamResponse?: boolean;
    resourceNames: Record<string, string>;
  }) => Promise<void>;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  isPending: boolean;
  error: Error | null;
  editorRef: React.RefObject<TamboEditor>;
  submitError: string | null;
  setSubmitError: React.Dispatch<React.SetStateAction<string | null>>;
  imageError: string | null;
  setImageError: React.Dispatch<React.SetStateAction<string | null>>;
  elicitation: TamboElicitationRequest | null;
  resolveElicitation: ((response: TamboElicitationResponse) => void) | null;
}


const MessageInputContext =
  React.createContext<MessageInputContextValue | null>(null);


const useMessageInputContext = () => {
  const context = React.useContext(MessageInputContext);
  if (!context) {
    throw new Error(
      "MessageInput sub-components must be used within a MessageInput",
    );
  }
  return context;
};


export interface MessageInputProps extends React.HTMLAttributes<HTMLFormElement> {
  
  variant?: VariantProps<typeof messageInputVariants>["variant"];
  
  inputRef?: React.RefObject<TamboEditor>;
  
  children?: React.ReactNode;
}


const MessageInput = React.forwardRef<HTMLFormElement, MessageInputProps>(
  ({ children, className, variant, ...props }, ref) => {
    return (
      <MessageInputInternal
        ref={ref}
        className={className}
        variant={variant}
        {...props}
      >
        <TooltipProvider>{children}</TooltipProvider>
      </MessageInputInternal>
    );
  },
);
MessageInput.displayName = "MessageInput";

const STORAGE_KEY = "tambo.components.messageInput.draft";

const getStorageKey = (key: string) => `${STORAGE_KEY}.${key}`;

const storeValueInSessionStorage = (key: string, value?: string) => {
  const storageKey = getStorageKey(key);
  if (value === undefined) {
    sessionStorage.removeItem(storageKey);
    return;
  }

  sessionStorage.setItem(storageKey, JSON.stringify({ rawQuery: value }));
};

const getValueFromSessionStorage = (key: string): string => {
  const storedValue = sessionStorage.getItem(getStorageKey(key)) ?? "";
  try {
    const parsed = JSON.parse(storedValue);
    return parsed.rawQuery ?? "";
  } catch {
    return "";
  }
};


const MessageInputInternal = React.forwardRef<
  HTMLFormElement,
  MessageInputProps
>(({ children, className, variant, inputRef, ...props }, ref) => {
  const {
    value,
    setValue,
    submit,
    isPending,
    error,
    images,
    addImages,
    removeImage,
  } = useTamboThreadInput();
  const { cancel, thread } = useTamboThread();
  const [displayValue, setDisplayValue] = React.useState("");
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [imageError, setImageError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const editorRef = React.useRef<TamboEditor>(null!);
  const dragCounter = React.useRef(0);

  
  const { elicitation, resolveElicitation } = useTamboElicitationContext();

  React.useEffect(() => {
    
    const storedValue = getValueFromSessionStorage(thread.id);
    if (!storedValue) return;
    setValue((value) => value ?? storedValue);
  }, [setValue, thread.id]);

  React.useEffect(() => {
    setDisplayValue(value);
    storeValueInSessionStorage(thread.id, value);
    if (value && editorRef.current) {
      editorRef.current.focus();
    }
  }, [value, thread.id]);

  const handleSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if ((!value.trim() && images.length === 0) || isSubmitting) return;

      
      setSubmitError(null);
      setImageError(null);
      setDisplayValue("");
      storeValueInSessionStorage(thread.id);
      setIsSubmitting(true);

      
      let latestResourceNames: Record<string, string> = {};
      const editor = editorRef.current;
      if (editor) {
        const extracted = editor.getTextWithResourceURIs();
        latestResourceNames = extracted.resourceNames;
      }

      const imageIdsAtSubmitTime = images.map((image) => image.id);

      try {
        await submit({
          streamResponse: true,
          resourceNames: latestResourceNames,
        });
        setValue("");
        
        
        if (imageIdsAtSubmitTime.length > 0) {
          imageIdsAtSubmitTime.forEach((id) => removeImage(id));
        }
        
        setTimeout(() => {
          editorRef.current?.focus();
        }, 0);
      } catch (error) {
        console.error("Failed to submit message:", error);
        setDisplayValue(value);
        
        setImageError(null);
        setSubmitError(
          error instanceof Error
            ? error.message
            : "Failed to send message. Please try again.",
        );

        
        await cancel();
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      value,
      submit,
      setValue,
      setDisplayValue,
      setSubmitError,
      cancel,
      isSubmitting,
      images,
      removeImage,
      editorRef,
      thread.id,
    ],
  );

  const handleDragEnter = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const hasImages = Array.from(e.dataTransfer.items).some((item) =>
        item.type.startsWith("image/"),
      );
      if (hasImages) {
        setIsDragging(true);
      }
    }
  }, []);

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = React.useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounter.current = 0;

      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/"),
      );

      if (files.length > 0) {
        const totalImages = images.length + files.length;
        if (totalImages > MAX_IMAGES) {
          setImageError(`Max ${MAX_IMAGES} uploads at a time`);
          return;
        }
        setImageError(null); 
        try {
          await addImages(files);
        } catch (error) {
          console.error("Failed to add dropped images:", error);
          setImageError(
            error instanceof Error
              ? error.message
              : "Failed to add images. Please try again.",
          );
        }
      }
    },
    [addImages, images, setImageError],
  );

  const handleElicitationResponse = React.useCallback(
    (response: TamboElicitationResponse) => {
      
      if (resolveElicitation) {
        resolveElicitation(response);
      }
    },
    [resolveElicitation],
  );

  const contextValue = React.useMemo(
    () => ({
      value: displayValue,
      setValue: (newValue: string) => {
        setValue(newValue);
        setDisplayValue(newValue);
      },
      submit,
      handleSubmit,
      isPending: isPending ?? isSubmitting,
      error,
      editorRef: inputRef ?? editorRef,
      submitError,
      setSubmitError,
      imageError,
      setImageError,
      elicitation,
      resolveElicitation,
    }),
    [
      displayValue,
      setValue,
      submit,
      handleSubmit,
      isPending,
      isSubmitting,
      error,
      inputRef,
      editorRef,
      submitError,
      imageError,
      setImageError,
      elicitation,
      resolveElicitation,
    ],
  );
  return (
    <MessageInputContext.Provider
      value={contextValue as MessageInputContextValue}
    >
      <form
        ref={ref}
        onSubmit={handleSubmit}
        className={cn(messageInputVariants({ variant }), className)}
        data-slot="message-input-form"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        {...props}
      >
        <div
          className={cn(
            "relative flex flex-col rounded-xl bg-background shadow-md p-2 px-3",
            isDragging
              ? "border border-dashed border-emerald-400"
              : "border border-border",
          )}
        >
          {isDragging && (
            <div className="absolute inset-0 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/30 flex items-center justify-center pointer-events-none z-20">
              <p className="text-emerald-700 dark:text-emerald-300 font-medium">
                Drop files here to add to conversation
              </p>
            </div>
          )}
          {elicitation ? (
            <ElicitationUI
              request={elicitation}
              onResponse={handleElicitationResponse}
            />
          ) : (
            <>
              <MessageInputStagedImages />
              {children}
            </>
          )}
        </div>
      </form>
    </MessageInputContext.Provider>
  );
});
MessageInputInternal.displayName = "MessageInputInternal";
MessageInput.displayName = "MessageInput";


const IS_PASTED_IMAGE = Symbol.for("tambo-is-pasted-image");


const MAX_IMAGES = 10;


declare global {
  interface File {
    [IS_PASTED_IMAGE]?: boolean;
  }
}


export interface MessageInputTextareaProps extends React.HTMLAttributes<HTMLDivElement> {
  
  placeholder?: string;
  
  resourceProvider?: ResourceProvider;
  
  promptProvider?: PromptProvider;
  
  onResourceSelect?: (item: ResourceItem) => void;
}


const MessageInputTextarea = ({
  className,
  placeholder = "What do you want to do?",
  resourceProvider,
  promptProvider,
  onResourceSelect,
  ...props
}: MessageInputTextareaProps) => {
  const { value, setValue, handleSubmit, editorRef, setImageError } =
    useMessageInputContext();
  const { isIdle } = useTamboThread();
  const { addImage, images } = useTamboThreadInput();
  const isUpdatingToken = useIsTamboTokenUpdating();
  
  const setResourceNames = React.useCallback(
    (
      _resourceNames:
        | Record<string, string>
        | ((prev: Record<string, string>) => Record<string, string>),
    ) => {
      
    },
    [],
  );

  
  const [resourceSearch, setResourceSearch] = React.useState("");

  
  const [promptSearch, setPromptSearch] = React.useState("");

  
  const resourceItems = useCombinedResourceList(
    resourceProvider,
    resourceSearch,
  );

  
  const promptItems = useCombinedPromptList(promptProvider, promptSearch);

  
  const [selectedMcpPromptName, setSelectedMcpPromptName] = React.useState<
    string | null
  >(null);
  const { data: selectedMcpPromptData } = useTamboMcpPrompt(
    selectedMcpPromptName ?? "",
  );

  
  React.useEffect(() => {
    if (selectedMcpPromptData && selectedMcpPromptName) {
      const promptMessages = selectedMcpPromptData?.messages;
      if (promptMessages) {
        const promptText = promptMessages
          .map((msg) => {
            if (msg.content?.type === "text") {
              return msg.content.text;
            }
            return "";
          })
          .filter(Boolean)
          .join("\n");

        const editor = editorRef.current;
        if (editor) {
          editor.setContent(promptText);
          setValue(promptText);
          editor.focus("end");
        }
      }
      setSelectedMcpPromptName(null);
    }
  }, [selectedMcpPromptData, selectedMcpPromptName, editorRef, setValue]);

  
  const handlePromptSelect = React.useCallback((item: PromptItem) => {
    if (item.id.startsWith("mcp-prompt:")) {
      const promptName = item.id.replace("mcp-prompt:", "");
      setSelectedMcpPromptName(promptName);
    }
  }, []);

  
  const pendingImagesRef = React.useRef(0);

  const handleAddImage = React.useCallback(
    async (file: File) => {
      if (images.length + pendingImagesRef.current >= MAX_IMAGES) {
        setImageError(`Max ${MAX_IMAGES} uploads at a time`);
        return;
      }
      setImageError(null);
      pendingImagesRef.current += 1;
      try {
        file[IS_PASTED_IMAGE] = true;
        await addImage(file);
      } finally {
        pendingImagesRef.current -= 1;
      }
    },
    [addImage, images, setImageError],
  );

  return (
    <div
      className={cn("flex-1", className)}
      data-slot="message-input-textarea"
      {...props}
    >
      <TextEditor
        ref={editorRef}
        value={value}
        onChange={setValue}
        onResourceNamesChange={setResourceNames}
        onSubmit={handleSubmit}
        onAddImage={handleAddImage}
        placeholder={placeholder}
        disabled={!isIdle || isUpdatingToken}
        className="bg-background text-foreground"
        onSearchResources={setResourceSearch}
        resources={resourceItems}
        onSearchPrompts={setPromptSearch}
        prompts={promptItems}
        onResourceSelect={onResourceSelect ?? (() => {})}
        onPromptSelect={handlePromptSelect}
      />
    </div>
  );
};
MessageInputTextarea.displayName = "MessageInput.Textarea";


export interface MessageInputPlainTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  
  placeholder?: string;
}


const MessageInputPlainTextarea = ({
  className,
  placeholder = "What do you want to do?",
  ...props
}: MessageInputPlainTextareaProps) => {
  const { value, setValue, handleSubmit, setImageError } =
    useMessageInputContext();
  const { isIdle } = useTamboThread();
  const { addImage, images } = useTamboThreadInput();
  const isUpdatingToken = useIsTamboTokenUpdating();
  const isPending = !isIdle;
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        await handleSubmit(e as unknown as React.FormEvent);
      }
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const { imageItems, hasText } = getImageItems(e.clipboardData);

    if (imageItems.length === 0) {
      return; 
    }

    if (!hasText) {
      e.preventDefault(); 
    }

    const totalImages = images.length + imageItems.length;
    if (totalImages > MAX_IMAGES) {
      setImageError(`Max ${MAX_IMAGES} uploads at a time`);
      return;
    }
    setImageError(null);

    for (const item of imageItems) {
      try {
        
        item[IS_PASTED_IMAGE] = true;
        await addImage(item);
      } catch (error) {
        console.error("Failed to add pasted image:", error);
      }
    }
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      className={cn(
        "flex-1 p-3 rounded-t-lg bg-background text-foreground resize-none text-sm min-h-[82px] max-h-[40vh] focus:outline-none placeholder:text-muted-foreground/50",
        className,
      )}
      disabled={isPending || isUpdatingToken}
      placeholder={placeholder}
      aria-label="Chat Message Input"
      data-slot="message-input-textarea"
      {...props}
    />
  );
};
MessageInputPlainTextarea.displayName = "MessageInput.PlainTextarea";


export interface MessageInputSubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  
  children?: React.ReactNode;
}


const MessageInputSubmitButton = React.forwardRef<
  HTMLButtonElement,
  MessageInputSubmitButtonProps
>(({ className, children, ...props }, ref) => {
  const { isPending } = useMessageInputContext();
  const { cancel, isIdle } = useTamboThread();
  const isUpdatingToken = useIsTamboTokenUpdating();

  
  
  
  const showCancelButton = isPending || !isIdle;

  const handleCancel = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await cancel();
  };

  const buttonClasses = cn(
    "w-10 h-10 bg-foreground text-background rounded-lg hover:bg-foreground/90 disabled:opacity-50 flex items-center justify-center enabled:cursor-pointer",
    className,
  );

  return (
    <button
      ref={ref}
      type={showCancelButton ? "button" : "submit"}
      disabled={isUpdatingToken}
      onClick={showCancelButton ? handleCancel : undefined}
      className={buttonClasses}
      aria-label={showCancelButton ? "Cancel message" : "Send message"}
      data-slot={
        showCancelButton ? "message-input-cancel" : "message-input-submit"
      }
      {...props}
    >
      {children ??
        (showCancelButton ? (
          <Square className="w-4 h-4" fill="currentColor" />
        ) : (
          <ArrowUp className="w-5 h-5" />
        ))}
    </button>
  );
});
MessageInputSubmitButton.displayName = "MessageInput.SubmitButton";

const MCPIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      color="#000000"
      fill="none"
    >
      <path
        d="M3.49994 11.7501L11.6717 3.57855C12.7762 2.47398 14.5672 2.47398 15.6717 3.57855C16.7762 4.68312 16.7762 6.47398 15.6717 7.57855M15.6717 7.57855L9.49994 13.7501M15.6717 7.57855C16.7762 6.47398 18.5672 6.47398 19.6717 7.57855C20.7762 8.68312 20.7762 10.474 19.6717 11.5785L12.7072 18.543C12.3167 18.9335 12.3167 19.5667 12.7072 19.9572L13.9999 21.2499"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
      <path
        d="M17.4999 9.74921L11.3282 15.921C10.2237 17.0255 8.43272 17.0255 7.32823 15.921C6.22373 14.8164 6.22373 13.0255 7.32823 11.921L13.4999 5.74939"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
    </svg>
  );
};

const MessageInputMcpConfigButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    className?: string;
  }
>(({ className, ...props }, ref) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const buttonClasses = cn(
    "w-10 h-10 rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    className,
  );

  return (
    <>
      <Tooltip content="Configure MCP Servers" side="right">
        <button
          ref={ref}
          type="button"
          onClick={() => setIsModalOpen(true)}
          className={buttonClasses}
          aria-label="Open MCP Configuration"
          data-slot="message-input-mcp-config"
          {...props}
        >
          <MCPIcon />
        </button>
      </Tooltip>
      <McpConfigModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
});
MessageInputMcpConfigButton.displayName = "MessageInput.McpConfigButton";


export type MessageInputErrorProps = React.HTMLAttributes<HTMLParagraphElement>;


const MessageInputError = React.forwardRef<
  HTMLParagraphElement,
  MessageInputErrorProps
>(({ className, ...props }, ref) => {
  const { error, submitError, imageError } = useMessageInputContext();

  if (!error && !submitError && !imageError) {
    return null;
  }

  return (
    <p
      ref={ref}
      className={cn("text-sm text-destructive mt-2", className)}
      data-slot="message-input-error"
      {...props}
    >
      {error?.message ?? submitError ?? imageError}
    </p>
  );
});
MessageInputError.displayName = "MessageInput.Error";


export interface MessageInputFileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  
  accept?: string;
  
  multiple?: boolean;
}


const MessageInputFileButton = React.forwardRef<
  HTMLButtonElement,
  MessageInputFileButtonProps
>(({ className, accept = "image/*", multiple = true, ...props }, ref) => {
  const { addImages, images } = useTamboThreadInput();
  const { setImageError } = useMessageInputContext();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);

    try {
      const totalImages = images.length + files.length;

      if (totalImages > MAX_IMAGES) {
        setImageError(`Max ${MAX_IMAGES} uploads at a time`);
        e.target.value = "";
        return;
      }

      setImageError(null);
      await addImages(files);
    } catch (error) {
      console.error("Failed to add selected files:", error);
    }
    
    e.target.value = "";
  };

  const buttonClasses = cn(
    "w-10 h-10 rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    className,
  );

  return (
    <Tooltip content="Attach Images" side="top">
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        className={buttonClasses}
        aria-label="Attach Images"
        data-slot="message-input-file-button"
        {...props}
      >
        <Paperclip className="w-4 h-4" />
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          className="hidden"
          aria-hidden="true"
        />
      </button>
    </Tooltip>
  );
});
MessageInputFileButton.displayName = "MessageInput.FileButton";


export type MessageInputMcpPromptButtonProps =
  React.ButtonHTMLAttributes<HTMLButtonElement>;


const MessageInputMcpPromptButton = React.forwardRef<
  HTMLButtonElement,
  MessageInputMcpPromptButtonProps
>(({ ...props }, ref) => {
  const { setValue, value } = useMessageInputContext();
  return (
    <McpPromptButton
      ref={ref}
      {...props}
      value={value}
      onInsertText={setValue}
    />
  );
});
MessageInputMcpPromptButton.displayName = "MessageInput.McpPromptButton";


export type MessageInputMcpResourceButtonProps =
  React.ButtonHTMLAttributes<HTMLButtonElement>;


const MessageInputMcpResourceButton = React.forwardRef<
  HTMLButtonElement,
  MessageInputMcpResourceButtonProps
>(({ ...props }, ref) => {
  const { setValue, value, editorRef } = useMessageInputContext();

  const insertResourceReference = React.useCallback(
    (id: string, label: string) => {
      const editor = editorRef.current;
      if (editor) {
        editor.insertMention(id, label);
        setValue(editor.getTextWithResourceURIs().text);
        return;
      }
      
      const newValue = value ? `${value} ${id}` : id;
      setValue(newValue);
    },
    [editorRef, setValue, value],
  );

  return (
    <McpResourceButton
      ref={ref}
      {...props}
      value={value}
      onInsertResource={insertResourceReference}
    />
  );
});
MessageInputMcpResourceButton.displayName = "MessageInput.McpResourceButton";


interface ImageContextBadgeProps {
  image: StagedImage;
  displayName: string;
  isExpanded: boolean;
  onToggle: () => void;
  onRemove: () => void;
}


const ImageContextBadge: React.FC<ImageContextBadgeProps> = ({
  image,
  displayName,
  isExpanded,
  onToggle,
  onRemove,
}) => (
  <div className="relative group flex-shrink-0">
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isExpanded}
      className={cn(
        "relative flex items-center rounded-lg border overflow-hidden",
        "border-border bg-background hover:bg-muted cursor-pointer",
        "transition-[width,height,padding] duration-200 ease-in-out",
        isExpanded ? "w-40 h-28 p-0" : "w-32 h-9 pl-3 pr-8 gap-2",
      )}
    >
      {isExpanded && (
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-150",
            "opacity-100 delay-100",
          )}
        >
          <div className="relative w-full h-full">
            <img
              src={image.dataUrl}
              alt={displayName}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-1 left-2 right-2 text-white text-xs font-medium truncate">
              {displayName}
            </div>
          </div>
        </div>
      )}
      <span
        className={cn(
          "flex items-center gap-1.5 text-sm text-foreground truncate leading-none transition-opacity duration-150",
          isExpanded ? "opacity-0" : "opacity-100 delay-100",
        )}
      >
        <ImageIcon className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="truncate">{displayName}</span>
      </span>
    </button>
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onRemove();
      }}
      className="absolute -top-1 -right-1 w-5 h-5 bg-background border border-border text-muted-foreground rounded-full flex items-center justify-center hover:bg-muted hover:text-foreground transition-colors shadow-sm z-10"
      aria-label={`Remove ${displayName}`}
    >
      <X className="w-3 h-3" />
    </button>
  </div>
);


export type MessageInputStagedImagesProps =
  React.HTMLAttributes<HTMLDivElement>;


const MessageInputStagedImages = React.forwardRef<
  HTMLDivElement,
  MessageInputStagedImagesProps
>(({ className, ...props }, ref) => {
  const { images, removeImage } = useTamboThreadInput();
  const [expandedImageId, setExpandedImageId] = React.useState<string | null>(
    null,
  );

  if (images.length === 0) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-wrap items-center gap-2 pb-2 pt-1 border-b border-border",
        className,
      )}
      data-slot="message-input-staged-images"
      {...props}
    >
      {images.map((image, index) => (
        <ImageContextBadge
          key={image.id}
          image={image}
          displayName={
            image.file?.[IS_PASTED_IMAGE] ? `Image ${index + 1}` : image.name
          }
          isExpanded={expandedImageId === image.id}
          onToggle={() =>
            setExpandedImageId(expandedImageId === image.id ? null : image.id)
          }
          onRemove={() => removeImage(image.id)}
        />
      ))}
    </div>
  );
});
MessageInputStagedImages.displayName = "MessageInput.StagedImages";


const MessageInputContexts = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <MessageInputStagedImages
    ref={ref}
    className={cn("pb-2 pt-1 border-b border-border", className)}
    {...props}
  />
));
MessageInputContexts.displayName = "MessageInputContexts";


const MessageInputToolbar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex justify-between items-center mt-2 p-1 gap-2",
        className,
      )}
      data-slot="message-input-toolbar"
      {...props}
    >
      <div className="flex items-center gap-2">
        
        {React.Children.map(children, (child): React.ReactNode => {
          if (
            React.isValidElement(child) &&
            child.type === MessageInputSubmitButton
          ) {
            return null; 
          }
          return child;
        })}
      </div>
      <div className="flex items-center gap-2">
        <DictationButton />
        
        {React.Children.map(children, (child): React.ReactNode => {
          if (
            React.isValidElement(child) &&
            child.type === MessageInputSubmitButton
          ) {
            return child; 
          }
          return null;
        })}
      </div>
    </div>
  );
});
MessageInputToolbar.displayName = "MessageInput.Toolbar";


export {
  DictationButton,
  MessageInput,
  MessageInputContexts,
  MessageInputError,
  MessageInputFileButton,
  MessageInputMcpConfigButton,
  MessageInputMcpPromptButton,
  MessageInputMcpResourceButton,
  MessageInputPlainTextarea,
  MessageInputStagedImages,
  MessageInputSubmitButton,
  MessageInputTextarea,
  MessageInputToolbar,
  messageInputVariants,
};


export type { PromptItem, ResourceItem } from "./text-editor";
