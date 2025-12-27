"use client";

import React from "react";

export function Toolbar(props: {
  onGenerate: () => void;
  onDownloadHtml?: () => void;
  canDownloadHtml?: boolean;
  onDownloadHtmlWithoutText?: () => void;
  canDownloadHtmlWithoutText?: boolean;
  onPrint?: () => void;
  canPrint?: boolean;
  onDownloadPdf: () => void;
  onDownloadPng: () => void;
  onDownloadJpg: () => void;
  busy?: boolean;
  generationStatus?: {
    step: string;
    progress: number;
    quality: string;
    suggestions: string[];
  } | null;
  useDefaultData?: boolean;
  onDefaultDataChange?: (useDefault: boolean) => void;
}) {
  const disabled = Boolean(props.busy);
  const canDownloadHtml = Boolean(props.onDownloadHtml) && Boolean(props.canDownloadHtml);
  const canDownloadHtmlWithoutText = Boolean(props.onDownloadHtmlWithoutText) && Boolean(props.canDownloadHtmlWithoutText);
  const canPrint = Boolean(props.onPrint) && Boolean(props.canPrint);

  return (
    <div className="flex flex-col gap-4">
      {/* Main Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={props.onGenerate}
          disabled={disabled}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-purple-600 px-6 text-sm font-semibold text-white disabled:opacity-60 hover:bg-purple-700 transition-opacity shadow-sm"
        >
          {disabled ? (
            <span
              aria-hidden="true"
              className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
            />
          ) : (
            <span>✨</span>
          )}
          {disabled ? "Generating..." : "Generate"}
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

        {props.onDownloadHtmlWithoutText ? (
          <button
            type="button"
            onClick={props.onDownloadHtmlWithoutText}
            disabled={disabled || !canDownloadHtmlWithoutText}
            className="inline-flex h-10 items-center justify-center rounded-md border border-black/12 bg-white px-4 text-sm font-medium text-black hover:bg-black/4 disabled:opacity-60"
          >
            HTML Tanpa Teks
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

      {/* Progress Status */}
      {props.generationStatus && (
        <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">
              {props.generationStatus.step}
            </span>
            <span className="text-xs font-semibold text-blue-700">
              {props.generationStatus.progress}%
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${props.generationStatus.progress}%` }}
            />
          </div>
          {props.generationStatus.suggestions.length > 0 && (
            <div className="mt-2 text-xs text-blue-700">
              <strong>Saran:</strong>
              <ul className="list-disc list-inside mt-1">
                {props.generationStatus.suggestions.slice(0, 2).map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
