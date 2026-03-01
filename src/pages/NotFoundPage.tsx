import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

export function NotFoundPage() {
  return (
    <Card className="max-w-xl">
      <div className="text-xl font-semibold dark:text-slate-50">404</div>
      <div className="pt-2 text-sm text-slate-600 dark:text-slate-300">That page doesn’t exist.</div>
      <div className="pt-4">
        <Link to="/">
          <Button>Back home</Button>
        </Link>
      </div>
    </Card>
  );
}
