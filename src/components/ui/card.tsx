import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-md", // Uses CSS variables for background
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
        "flex flex-col space-y-1.5 p-6 relative pl-8", // Added pl-8 for accent bar space
        "before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-primary", // 4px primary accent bar
         className
    )}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

// Use div for CardTitle to avoid semantic HTML issues with headings
const CardTitle = React.forwardRef<
  HTMLDivElement, // Changed from HTMLParagraphElement to HTMLDivElement
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
        "text-lg font-semibold leading-none tracking-tight text-foreground", // Use foreground color
         className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle"

// Use div for CardDescription
const CardDescription = React.forwardRef<
  HTMLDivElement, // Changed from HTMLParagraphElement to HTMLDivElement
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription"


const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
