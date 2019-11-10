class CopyText {
  public static toClipboard(text: string) {
    if (!(<any>navigator).clipboard) {
      CopyText.copyToClipboardFallback(text);
      return;
    }
    (<any>navigator).clipboard.writeText(text).then(
      () => {
        // Ignore
      },
      error => {
        CopyText.copyToClipboardFallback(text);
      }
    );
  }

  private static copyToClipboardFallback(text: string) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.setAttribute("readonly", "");
    textArea.style.position = "absolute";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);

    // Remember existing selection
    const selected = document.getSelection().rangeCount > 0 ? document.getSelection().getRangeAt(0) : false;

    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);

    // If a selection existed before copying, unselect everything on the HTML document and restore the original selection
    if (selected) {
      document.getSelection().removeAllRanges();
      document.getSelection().addRange(selected);
    }
  }
}
