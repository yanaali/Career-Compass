import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input, Textarea } from "../ui/Input";

const Schema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: z.string().email("Invalid email"),
  message: z.string().min(10, "Message is too short")
});

type Form = z.infer<typeof Schema>;

export function ContactPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitSuccessful }
  } = useForm<Form>({ resolver: zodResolver(Schema) });

  function onSubmit(data: Form) {
    // For a production-ready contact form, connect Formspree, Resend, or a server endpoint.
    // For now, we open the user's email client with a pre-filled mailto.
    const subject = encodeURIComponent(`Career Compass message from ${data.name}`);
    const body = encodeURIComponent(`${data.message}

Reply to: ${data.email}`);
    window.location.href = `mailto:aaliyanm219@gmail.com?subject=${subject}&body=${body}`;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 md:items-start">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight dark:text-slate-50">Contact</h2>
        <p className="text-slate-600 dark:text-slate-300">
          Want to connect? Whether it’s collaboration, opportunities, or feedback on Career Compass, feel free to reach out. I read every message.
        </p>
<Card className="mt-4">
          <div className="text-sm font-medium dark:text-slate-100">A quick note</div>
          <ul className="pt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
            <li>• This form opens your email client with a pre-filled message for speed.</li>
            <li>• If you deploy a server endpoint, add rate limiting and spam protection.</li>
            <li>• If you want, you can also add analytics to learn what visitors care about.</li>
          </ul>
        </Card>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Name</div>
            <Input placeholder="Your name" {...register("name")} />
            {errors.name && <div className="pt-1 text-xs text-red-600">{errors.name.message}</div>}
          </div>

          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Email</div>
            <Input placeholder="you@example.com" {...register("email")} />
            {errors.email && <div className="pt-1 text-xs text-red-600">{errors.email.message}</div>}
          </div>

          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Message</div>
            <Textarea rows={5} placeholder="How can I help?" {...register("message")} />
            {errors.message && <div className="pt-1 text-xs text-red-600">{errors.message.message}</div>}
          </div>

          <Button type="submit" className="w-full">Send</Button>
          {isSubmitSuccessful && (
            <div className="text-xs text-slate-500 dark:text-slate-400">Your email client should open with a pre-filled message.</div>
          )}
        </form>
      </Card>
    </div>
  );
}
