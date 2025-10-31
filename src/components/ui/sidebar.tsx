"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { VariantProps, cva } from "class-variance-authority"
import { PanelLeft } from "lucide-react"

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "240px" // Set fixed width
const SIDEBAR_WIDTH_MOBILE = "288px" // Example mobile width (can adjust)
const SIDEBAR_WIDTH_ICON = "48px" // Icon-only width
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

type SidebarContext = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContext | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }

  return context
}

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    defaultOpen?: boolean
    open?: boolean
    onOpenChange?: (open: boolean) => void
  }
>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const isMobile = useIsMobile()
    const [openMobile, setOpenMobile] = React.useState(false)
    const [_open, _setOpen] = React.useState(defaultOpen)
    const open = openProp ?? _open
    const setOpen = React.useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        const openState = typeof value === "function" ? value(open) : value
        if (setOpenProp) {
          setOpenProp(openState)
        } else {
          _setOpen(openState)
        }
        document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
      },
      [setOpenProp, open]
    )

    const toggleSidebar = React.useCallback(() => {
      return isMobile
        ? setOpenMobile((open) => !open)
        : setOpen((open) => !open)
    }, [isMobile, setOpen, setOpenMobile])

    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (
          event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault()
          toggleSidebar()
        }
      }

      window.addEventListener("keydown", handleKeyDown)
      return () => window.removeEventListener("keydown", handleKeyDown)
    }, [toggleSidebar])

    const state = open ? "expanded" : "collapsed"

    const contextValue = React.useMemo<SidebarContext>(
      () => ({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      }),
      [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
    )

    return (
      <SidebarContext.Provider value={contextValue}>
        <TooltipProvider delayDuration={0}>
          <div
            style={
              {
                "--sidebar-width": SIDEBAR_WIDTH, // Use fixed width
                "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
                ...style,
              } as React.CSSProperties
            }
            // Removed has-[[data-variant=inset]]:bg-sidebar-background - handled directly by Sidebar
            className={cn("group/sidebar-wrapper flex min-h-svh w-full", className)}
            ref={ref}
            {...props}
          >
            {children}
          </div>
        </TooltipProvider>
      </SidebarContext.Provider>
    )
  }
)
SidebarProvider.displayName = "SidebarProvider"

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    side?: "left" | "right"
    variant?: "sidebar" | "floating" | "inset"
    collapsible?: "offcanvas" | "icon" | "none"
  }
>(
  (
    {
      side = "left",
      variant = "sidebar",
      collapsible = "icon", // Default to icon collapse
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar()

    if (collapsible === "none") {
      return (
        <div
          className={cn(
            "flex h-full flex-col bg-sidebar text-sidebar-foreground", // Apply sidebar background and text color
             "w-[--sidebar-width]", // Ensure width is applied
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      )
    }

    if (isMobile) {
      return (
        <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
          <SheetContent
            data-sidebar="sidebar"
            data-mobile="true"
            className="bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden" // Apply sidebar background and text color
            style={
              {
                "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
              } as React.CSSProperties
            }
            side={side}
          >
            <div className="flex h-full w-full flex-col">{children}</div>
          </SheetContent>
        </Sheet>
      )
    }

    return (
      // Container div for desktop sidebar logic
      <div
        ref={ref}
        className={cn(
            "hidden md:block shrink-0 bg-sidebar text-sidebar-foreground", // Apply colors and prevent shrinking
            "transition-[width] duration-200 ease-linear", // Smooth width transition
             state === 'expanded' ? "w-[--sidebar-width]" : "w-[--sidebar-width-icon]" // Apply widths based on state
             // Add border if needed, e.g., side === 'left' ? "border-r border-sidebar-border" : "border-l border-sidebar-border"
             // For floating/inset variants, add padding and rounded corners if needed
        )}
        data-state={state}
        data-collapsible={collapsible}
        data-variant={variant}
        data-side={side}
        {...props}
      >
         {/* Actual sidebar content container */}
         <div className="flex h-full flex-col overflow-hidden">
            {children}
         </div>
      </div>
    )
  }
)
Sidebar.displayName = "Sidebar"


// SidebarTrigger remains mostly the same, ensure colors match
const SidebarTrigger = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button>
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      ref={ref}
      data-sidebar="trigger"
      variant="ghost"
      size="icon"
      // Use foreground color, hover uses sidebar-hover background
      className={cn("h-8 w-8 text-foreground hover:bg-sidebar-hover hover:text-sidebar-foreground", className)}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <PanelLeft />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
})
SidebarTrigger.displayName = "SidebarTrigger"

// SidebarInset for main content area
const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"main">
>(({ className, ...props }, ref) => {
  return (
    <main
      ref={ref}
      // Apply main background color
      className={cn("relative flex min-h-svh flex-1 flex-col bg-background", className)}
      {...props}
    />
  )
})
SidebarInset.displayName = "SidebarInset"

// SidebarHeader remains mostly the same
const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="header"
      // Ensure padding matches design
      className={cn("flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
})
SidebarHeader.displayName = "SidebarHeader"

// SidebarFooter remains mostly the same
const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="footer"
       // Ensure padding matches design
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  )
})
SidebarFooter.displayName = "SidebarFooter"

// SidebarSeparator uses sidebar-border color
const SidebarSeparator = React.forwardRef<
  React.ElementRef<typeof Separator>,
  React.ComponentProps<typeof Separator>
>(({ className, ...props }, ref) => {
  return (
    <Separator
      ref={ref}
      data-sidebar="separator"
      className={cn("mx-2 my-1 w-auto bg-sidebar-border", className)}
      {...props}
    />
  )
})
SidebarSeparator.displayName = "SidebarSeparator"

// SidebarContent remains mostly the same
const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="content"
      // Adjust padding if needed
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-1 overflow-auto px-2", // Use gap-1 for menu items
         "group-data-[state=collapsed]:overflow-hidden",
        className
      )}
      {...props}
    />
  )
})
SidebarContent.displayName = "SidebarContent"

// SidebarMenu remains the same
const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu"
    className={cn("flex w-full min-w-0 flex-col gap-1", className)} // Use gap-1
    {...props}
  />
))
SidebarMenu.displayName = "SidebarMenu"

// SidebarMenuItem remains the same
const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    data-sidebar="menu-item"
    className={cn("group/menu-item relative", className)}
    {...props}
  />
))
SidebarMenuItem.displayName = "SidebarMenuItem"


// Updated CVA for SidebarMenuButton using new theme colors
const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-colors focus-visible:ring-1 group-data-[state=expanded]:h-10 group-data-[state=collapsed]:h-10 group-data-[state=collapsed]:w-10 group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:p-0 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "text-sidebar-foreground", // Base text color for default
        ghost: "text-sidebar-foreground hover:bg-sidebar-hover hover:text-sidebar-foreground", // Ghost hover
        // Add other variants if needed (e.g., outline)
      },
      isActive: { // State for active item
         true: "bg-sidebar-accent text-sidebar-foreground font-medium", // Teal background, light text
         false: "hover:bg-sidebar-hover", // Default hover
      }
    },
    defaultVariants: {
      variant: "ghost", // Default to ghost for menu items
      isActive: false,
    },
  }
)

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean
    isActive?: boolean
    tooltip?: string | React.ComponentProps<typeof TooltipContent>
  } & Omit<VariantProps<typeof sidebarMenuButtonVariants>, "isActive"> // Omit isActive from props
>(
  (
    {
      asChild = false,
      isActive = false, // Receive isActive prop
      variant = "ghost",
      tooltip,
      className,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"
    const { isMobile, state } = useSidebar()

    const button = (
      <Comp
        ref={ref}
        data-sidebar="menu-button"
        data-active={isActive} // Add data-active attribute
        className={cn(sidebarMenuButtonVariants({ variant, isActive }), className)} // Pass isActive to CVA
        {...props}
      />
    )

    if (!tooltip) {
      return button
    }

    if (typeof tooltip === "string") {
      tooltip = {
        children: tooltip,
      }
    }

    const tooltipContentProps = typeof tooltip === 'object' ? tooltip : {};

    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent
          side="right"
          align="center"
          hidden={state !== "collapsed" || isMobile}
          // Use sidebar-hover for tooltip background, light text
          className="bg-sidebar-hover text-sidebar-foreground border-sidebar-border shadow-overlay"
          {...tooltipContentProps}
        >
          {typeof tooltip === 'string' ? tooltip : tooltip.children}
        </TooltipContent>
      </Tooltip>
    )
  }
)
SidebarMenuButton.displayName = "SidebarMenuButton"


// SidebarMenuSub for submenu container
const SidebarMenuSub = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu-sub"
    // Use sidebar-submenu-background, rounded, solid background
    className={cn(
      "ml-4 my-1 flex min-w-0 flex-col gap-1 rounded-md p-1 bg-sidebar-submenu-background text-sidebar-submenu-foreground",
      "group-data-[state=collapsed]:hidden", // Hide when parent is collapsed
      className
    )}
    {...props}
  />
))
SidebarMenuSub.displayName = "SidebarMenuSub"

// SidebarMenuSubItem remains simple
const SidebarMenuSubItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ ...props }, ref) => <li ref={ref} className="relative" {...props} />) // Added relative positioning if needed
SidebarMenuSubItem.displayName = "SidebarMenuSubItem"


// Updated CVA for SidebarMenuSubButton
const sidebarMenuSubButtonVariants = cva(
  "flex h-8 min-w-0 w-full items-center gap-2 overflow-hidden rounded-md px-2 text-sm text-sidebar-submenu-foreground outline-none ring-sidebar-ring transition-colors focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      isActive: {
        true: "bg-sidebar-accent text-sidebar-foreground font-medium", // Active style for submenu item (Teal)
        false: "hover:bg-sidebar-accent/20", // Subtle hover on submenu items
      }
    },
    defaultVariants: {
      isActive: false,
    },
  }
);

const SidebarMenuSubButton = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentProps<"a"> & {
    asChild?: boolean
    isActive?: boolean
  }
>(({ asChild = false, isActive = false, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a"

  return (
    <Comp
      ref={ref}
      data-sidebar="menu-sub-button"
      className={cn(
        sidebarMenuSubButtonVariants({ isActive }), // Use updated CVA
        "group-data-[state=collapsed]:hidden", // Hide when parent is collapsed
        className
      )}
      {...props}
    />
  )
})

SidebarMenuSubButton.displayName = "SidebarMenuSubButton"


export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  // SidebarGroup, // Removed as not used in current design
  // SidebarGroupAction,
  // SidebarGroupContent,
  // SidebarGroupLabel,
  SidebarHeader,
  // SidebarInput, // Removed as not used
  SidebarInset,
  SidebarMenu,
  // SidebarMenuAction, // Removed as not used
  // SidebarMenuBadge, // Removed as not used
  SidebarMenuButton,
  SidebarMenuItem,
  // SidebarMenuSkeleton, // Can be added back if needed
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  // SidebarRail, // Removed as not used
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
}
