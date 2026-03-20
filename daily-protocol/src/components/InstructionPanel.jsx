function isSafeUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function InstructionPanel({ item }) {
  return (
    <div className="px-4 py-3 bg-gray-750 border-t border-gray-700/50" style={{ backgroundColor: 'rgba(55, 65, 81, 0.5)' }}>
      {/* Instructions */}
      <div className="text-sm text-gray-300 whitespace-pre-line leading-relaxed">
        {item.instructions}
      </div>

      {/* Product link */}
      {item.product && (
        <div className="mt-2 text-sm">
          <span className="text-gray-500">Product: </span>
          {item.productUrl && isSafeUrl(item.productUrl) ? (
            <a
              href={item.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline"
            >
              {item.product}
            </a>
          ) : (
            <span className="text-gray-400">{item.product}</span>
          )}
        </div>
      )}
    </div>
  );
}
