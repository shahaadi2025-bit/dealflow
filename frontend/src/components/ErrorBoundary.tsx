"use client";
import { Component, ReactNode } from "react";

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message || "Something went wrong." };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="py-16 text-center border border-down/30 bg-down/5 max-w-lg mx-auto mt-10">
          <p className="text-down mb-2 text-[14px]">Something broke on this page.</p>
          <p className="text-dim text-[12px] mb-4">{this.state.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="border border-line px-4 py-2 text-[12px] text-ink hover:border-signal transition-colors"
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}