// src/shared/components/ui/form/index.tsx
import * as React from "react"
import { cn } from "@/shared/utils"

// Form Root Component
interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {}

const Form = React.forwardRef<HTMLFormElement, FormProps>(
  ({ className, ...props }, ref) => (
    <form
      ref={ref}
      className={cn("space-y-6", className)}
      {...props}
    />
  )
)
Form.displayName = "Form"

// Form Item Component
interface FormItemProps extends React.HTMLAttributes<HTMLDivElement> {}

const FormItem = React.forwardRef<HTMLDivElement, FormItemProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("space-y-2", className)}
      {...props}
    />
  )
)
FormItem.displayName = "FormItem"

// Form Label Component
interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    />
  )
)
FormLabel.displayName = "FormLabel"

// Form Control Component
interface FormControlProps extends React.HTMLAttributes<HTMLDivElement> {}

const FormControl = React.forwardRef<HTMLDivElement, FormControlProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("mt-2", className)}
      {...props}
    />
  )
)
FormControl.displayName = "FormControl"

// Form Description Component
interface FormDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const FormDescription = React.forwardRef<HTMLParagraphElement, FormDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
)
FormDescription.displayName = "FormDescription"

// Form Message Component
interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const FormMessage = React.forwardRef<HTMLParagraphElement, FormMessageProps>(
  ({ className, children, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {children}
    </p>
  )
)
FormMessage.displayName = "FormMessage"

// Form Field Component
interface FormFieldProps {
  name: string;
  control?: any;
  render: (props: { field: any }) => React.ReactNode;
  children?: React.ReactNode;
}

const FormField = ({ 
  name, 
  control, 
  render
}: FormFieldProps) => {
  // This is a simplified version - in a real app, this would integrate with a form library
  const field = {
    name,
    value: '',
    onChange: (e: any) => console.log('Field changed:', e),
    onBlur: () => console.log('Field blurred'),
    ref: React.createRef()
  };

  return render({ field });
};

export {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField
}
