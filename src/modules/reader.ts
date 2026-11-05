import { config } from "../../package.json";

export function registerReaderInitializer() {
  // 只保留阅读器选中文本翻译（核心）；批注翻译按钮已移除。
  Zotero.Reader.registerEventListener(
    "renderTextSelectionPopup",
    (event) => {
      const { params } = event;
      addon.data.translate.selectedText = params.annotation.text.trim();
      addon.hooks.onReaderPopupShow(event);
    },
    config.addonID,
  );
}
