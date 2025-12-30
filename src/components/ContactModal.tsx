import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Mail, Phone, User, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { PROPERTY_CONFIG } from "@/config/property";

const periodIds = ["july", "august", "md_to_ld"] as const;

const formSchema = z.object({
  name: z.string()
    .trim()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(100, { message: "Name must be less than 100 characters" }),
  email: z.string()
    .trim()
    .email({ message: "Please enter a valid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  phone: z
    .string()
    .trim()
    .max(16, { message: "Phone number is too long" })
    .optional(),
  message: z.string()
    .trim()
    .optional(),
  periodId: z.enum(periodIds).optional(),
});

type FormValues = z.infer<typeof formSchema>;

const encodeFormData = (data: Record<string, string>) =>
  new URLSearchParams(data).toString();

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactModal = ({ isOpen, onClose }: ContactModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: "",
      periodId: undefined,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);

    // Resolve the selected period label from the main property config
    const selectedPeriod = PROPERTY_CONFIG.rentPeriods.find(
      (p) => p.id === values.periodId
    );

    try {
      const body = encodeFormData({
        "form-name": "interest",
        name: values.name,
        email: values.email,
        phone: values.phone ?? "",
        message: values.message ?? "",
        periodId: values.periodId,
        periodLabel: selectedPeriod?.label ?? "",
      });

      const response = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });

      if (!response.ok) {
        throw new Error(`Form submission failed with status ${response.status}`);
      }

      toast.success("Thank you for your interest!", {
        description: "We've received your details and will be in touch soon.",
      });

      // Google Ads conversion tracking for Express Interest form submissions
      if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
        (window as any).gtag("event", "conversion", {
          send_to: "AW-17829976959/JtVACMi1gtcbEP-2_7VC",
        });
      }
    } catch (error) {
      console.error("Failed to submit interest form", error);
      toast.error("Something went wrong while submitting your request.");
    }

    form.reset();
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[500px] h-[100dvh] sm:h-auto w-full max-w-none sm:rounded-lg top-0 translate-y-0 sm:top-[50%] sm:translate-y-[-50%] p-0 gap-0 overflow-hidden flex flex-col border-0 sm:border">
        <div className="p-6 pb-4">
          <DialogHeader>
            <DialogTitle className="font-serif text-3xl">Express Your Interest</DialogTitle>
            <DialogDescription>
              Please fill out the form below.
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="flex-1 overflow-y-auto px-6">
          <Form {...form}>
            <form id="contact-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Full Name<sup>*</sup></FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" aria-hidden="true" />
                      <Input 
                        placeholder="Alexis Baldwin" 
                        autoComplete="name"
                        className={cn("pl-10", fieldState.error && "border-destructive focus-visible:ring-destructive")} 
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Email<sup>*</sup></FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" aria-hidden="true" />
                      <Input 
                        type="email" 
                        autoComplete="email"
                        placeholder="alexis@example.com" 
                        className={cn("pl-10", fieldState.error && "border-destructive focus-visible:ring-destructive")} 
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" aria-hidden="true" />
                      <Input 
                        type="tel" 
                        autoComplete="tel"
                        placeholder="(212) 555-1212" 
                        className="pl-10" 
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="periodId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rental Period</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" aria-hidden="true" />
                      <select
                        className="w-full appearance-none rounded-md border border-input bg-background py-2 pl-10 pr-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        value={field.value ?? ""}
                        onChange={(event) => field.onChange(event.target.value)}
                      >
                        <option value="" disabled>
                          Please click to select rental period of interest
                        </option>
                        {PROPERTY_CONFIG.rentPeriods.map((period) => (
                          <option key={period.id} value={period.id}>
                            {period.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                      <Textarea
                      placeholder="Please tell us about yourselves and list any questions you might have"
                      className="min-h-[100px] resize-none"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        </div>
        <div className="border-t bg-background px-6 py-4">
          <p className="text-xs text-muted-foreground mb-3">
            <sup className="text-destructive">*</sup>Required
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="contact-form"
              className="bg-accent hover:bg-accent/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
