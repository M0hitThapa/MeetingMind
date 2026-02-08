import { Slot } from "@radix-ui/react-slot";
import { getMessageImages } from "@/lib/thread-hooks";
import * as React from "react";
import { useMessageRootContext } from "../root/message-root-context";


export interface MessageImageRenderFnProps {
  
  url: string;
  
  index: number;
  
  alt?: string;
}

export interface MessageImagesProps extends React.HTMLAttributes<HTMLDivElement> {
  
  asChild?: boolean;
  
  renderImage?: (props: MessageImageRenderFnProps) => React.ReactNode;
  
  children?: React.ReactNode;
}


export const MessageImages = React.forwardRef<
  HTMLDivElement,
  MessageImagesProps
>(({ asChild, renderImage, children, ...props }, ref) => {
  const { message } = useMessageRootContext();
  const images = getMessageImages(message.content);

  if (images.length === 0) {
    return null;
  }

  const Comp = asChild ? Slot : "div";

  return (
    <Comp ref={ref} data-slot="message-images" {...props}>
      {children ??
        images.map((url: string, index: number) =>
          renderImage ? (
            <React.Fragment key={index}>
              {renderImage({ url, index })}
            </React.Fragment>
          ) : (
            <img key={index} src={url} alt={`Image ${index + 1}`} />
          ),
        )}
    </Comp>
  );
});
MessageImages.displayName = "Message.Images";
