"use client";

import React from "react";

export function Toolbar(props: {
  onGenerate: () => void;
  onDownloadHtml?: () => void;
  canDownloadHtml?: boolean;
  onPrint?: () => void;
  canPrint?: boolean;
  onDownloadPdf: () => void;
  onDownloadPng: () => void;
  onDownloadJpg: () => void;
  busy?: boolean;
}) {
  const disabled = Boolean(props.busy);
  const canDownloadHtml = Boolean(props.onDownloadHtml) && Boolean(props.canDownloadHtml);
  const canPrint = Boolean(props.onPrint) && Boolean(props.canPrint);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={props.onGenerate}
        disabled={disabled}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-foreground px-4 text-sm font-medium text-background disabled:opacity-60"
      >
        {disabled ? (
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-background/40 border-t-background"
          />
        ) : null}
        Generate
      </button>

      {props.onDownloadHtml ? (
        <button
          type="button"
          onClick={props.onDownloadHtml}
          disabled={disabled || !canDownloadHtml}
          className="inline-flex h-10 items-center justify-center rounded-md border border-black/12 bg-white px-4 text-sm font-medium text-black hover:bg-black/4 disabled:opacity-60"
        >
          Download HTML
        </button>
      ) : null}

      {props.onPrint ? (
        <button
          type="button"
          onClick={props.onPrint}
          disabled={disabled || !canPrint}
          className="inline-flex h-10 items-center justify-center rounded-md border border-black/12 bg-white px-4 text-sm font-medium text-black hover:bg-black/4 disabled:opacity-60"
        >
          Print
        </button>
      ) : null}

      <div className="h-6 w-px bg-black/10" />

      <button
        type="button"
        onClick={props.onDownloadPdf}
        disabled={disabled}
        className="inline-flex h-10 items-center justify-center rounded-md border border-black/12 bg-white px-4 text-sm font-medium text-black hover:bg-black/4 disabled:opacity-60"
      >
        Download PDF
      </button>
      <button
        type="button"
        onClick={props.onDownloadPng}
        disabled={disabled}
        className="inline-flex h-10 items-center justify-center rounded-md border border-black/12 bg-white px-4 text-sm font-medium text-black hover:bg-black/4 disabled:opacity-60"
      >
        PNG
      </button>
      <button
        type="button"
        onClick={props.onDownloadJpg}
        disabled={disabled}
        className="inline-flex h-10 items-center justify-center rounded-md border border-black/12 bg-white px-4 text-sm font-medium text-black hover:bg-black/4 disabled:opacity-60"
      >
        JPG
      </button>
    </div>
  );
}
