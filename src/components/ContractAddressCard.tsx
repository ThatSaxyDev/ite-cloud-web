import { useState } from "react";

const CONTRACT_ADDRESS =
  "KNANiTVBP8RBwAz7FpE4Bz8Bc8sz1xSNKXbqXVNBAGS";

function SolanaIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 397 311"
      width="14"
      height="11"
      fill="currentColor"
    >
      <path d="M64 252.6 90.4 224c1.4 1.5 3 2.7 5 2.7h301.6c3.4 0 5-3.4 2.6-5.7l-22.8-23.5c-1.6-1.6-3.7-2.5-6-2.5H69.2c-3.4 0-5 3.4-2.6 5.7L64 252.6zM332.8 5.7 306.4 34.3c-1.5 1.5-2.3 3.5-2.3 5.5v1.2c0 3.4 3.4 5 5.7 2.6L332.6 21c1.5-1.5 2.2-3.7 2.2-5.7 0-3.4-3.4-5-5.7-2.6l3.7-7zM64 115.4l26.4-28.6c1.5 1.5 3.5 2.3 5.5 2.3h301.6c3.4 0 5-3.4 2.6-5.7L377.3 60c-1.6-1.6-3.7-2.5-6-2.5H69.7c-3.4 0-5 3.4-2.6 5.7L64 115.4zM332.8 162.3 306.4 191c-1.5 1.5-2.3 3.5-2.3 5.5 0 3.4 3.4 5 5.7 2.6l22.8-22.6c1.5-1.5 2.2-3.7 2.2-5.7 0-3.4-3.4-5-5.7-2.6l3.7-5.9zM64 5.7 90.4 34.3c1.5 1.5 3.5 2.3 5.5 2.3h301.6c3.4 0 5-3.4 2.6-5.7L377.3 2.5C375.7.9 373.6 0 371.3 0H69.7c-3.4 0-5 3.4-2.6 5.7L64 5.7z" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V6a2 2 0 0 1 2-2h9" />
    </svg>
  );
}

export function ContractAddressCard() {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(CONTRACT_ADDRESS);
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
      }, 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section
      className="contract-card"
      aria-label="Contract address"
    >
      <h2 className="contract-card-title" data-scramble>
        Contract address
      </h2>

      <div className="contract-chain">
        <span className="contract-chain-icon" aria-hidden="true">
          <SolanaIcon />
        </span>
        <span>Solana</span>
      </div>

      <div className="contract-address-row">
        <code className="contract-address-code" aria-live="polite">
          {copied ? "Copied" : CONTRACT_ADDRESS}
        </code>
        <button
          aria-label="Copy contract address"
          className="contract-address-copy"
          onClick={() => void handleCopy()}
          type="button"
        >
          <CopyIcon />
        </button>
      </div>
    </section>
  );
}
