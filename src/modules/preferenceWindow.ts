import { config, homepage } from "../../package.json";
import { LANG_CODE } from "../utils/config";
import { getString } from "../utils/locale";
import { getPref, setPref } from "../utils/prefs";
import {
  getServiceSecret,
  setServiceSecret,
  validateServiceSecret,
} from "../utils/secret";
import { createServiceSettingsDialog } from "../utils";
import { services } from "./services";

export function registerPrefsWindow() {
  Zotero.PreferencePanes.register({
    pluginID: config.addonID,
    src: rootURI + "chrome/content/preferences.xhtml",
    label: getString("pref-title"),
    image: `chrome://${config.addonRef}/content/icons/favicon.png`,
    helpURL: homepage,
  });
}

export function registerPrefsScripts(_window: Window) {
  // This function is called when the prefs window is opened
  addon.data.prefs.window = _window;
  buildPrefsPane();
  updatePrefsPaneDefault();
}

function buildPrefsPane() {
  const doc = addon.data.prefs.window?.document;
  if (!doc) {
    return;
  }

  // menus
  ztoolkit.UI.replaceElement(
    {
      tag: "menulist",
      id: makeId("sentenceServices"),
      attributes: {
        value: getPref("translateSource") as string,
        native: "true",
      },
      listeners: [
        {
          type: "command",
          listener: (e: Event) => {
            onPrefsEvents("setSentenceService");
          },
        },
      ],
      children: [
        {
          tag: "menupopup",
          children: services.getAllServicesWithType("sentence").map((s) => ({
            tag: "menuitem",
            attributes: {
              label: services.getServiceNameByID(s.id),
              value: s.id,
            },
          })),
        },
      ],
    },
    doc.querySelector(`#${makeId("sentenceServices-placeholder")}`)!,
  );

  ztoolkit.UI.replaceElement(
    {
      tag: "menulist",
      id: makeId("langfrom"),
      attributes: {
        value: getPref("sourceLanguage") as string,
        native: "true",
      },
      listeners: [
        {
          type: "command",
          listener: (e: Event) => {
            onPrefsEvents("setSourceLanguage");
          },
        },
      ],
      styles: {
        maxWidth: "250px",
      },
      children: [
        {
          tag: "menupopup",
          children: LANG_CODE.map((lang) => ({
            tag: "menuitem",
            attributes: {
              label: lang.name,
              value: lang.code,
            },
          })),
        },
      ],
    },
    doc.querySelector(`#${makeId("langfrom-placeholder")}`)!,
  );

  ztoolkit.UI.replaceElement(
    {
      tag: "menulist",
      id: makeId("langto"),
      attributes: {
        value: getPref("targetLanguage") as string,
        native: "true",
      },
      listeners: [
        {
          type: "command",
          listener: (e: Event) => {
            onPrefsEvents("setTargetLanguage");
          },
        },
      ],
      styles: {
        maxWidth: "250px",
      },
      children: [
        {
          tag: "menupopup",
          children: LANG_CODE.map((lang) => ({
            tag: "menuitem",
            attributes: {
              label: lang.name,
              value: lang.code,
            },
          })),
        },
      ],
    },
    doc.querySelector(`#${makeId("langto-placeholder")}`)!,
  );

  doc
    .querySelector(`#${makeId("manageKeys")}`)
    ?.addEventListener("command", (e: Event) => {
      onPrefsEvents("manageKeys");
    });
  doc
    .querySelector(`#${makeId("renameServices")}`)
    ?.addEventListener("command", (e: Event) => {
      onPrefsEvents("renameServices");
    });

  doc
    .querySelector(`#${makeId("enableAuto")}`)
    ?.addEventListener("command", (e: Event) => {
      onPrefsEvents("setAutoTranslateSelection");
    });

  doc
    .querySelector(`#${makeId("enablePopup")}`)
    ?.addEventListener("command", (e: Event) => {
      onPrefsEvents("setEnablePopup");
    });

  doc
    .querySelector(`#${makeId("showPlayBtn")}`)
    ?.addEventListener("command", (e: Event) => {
      onPrefsEvents("setShowPlayBtn");
    });

  doc
    .querySelector(`#${makeId("hideUnconfiguredServices")}`)
    ?.addEventListener("command", () => {
      addon.hooks.onReaderTabPanelRefresh();
    });

  doc
    .querySelector(`#${makeId("sentenceServicesSecret")}`)
    ?.addEventListener("blur", (e: Event) => {
      onPrefsEvents("updateSentenceSecret");
    });

  doc
    .querySelector(`#${makeId("fontSize")}`)
    ?.addEventListener("input", (e: Event) => {
      onPrefsEvents("updateFontSize");
    });

  doc
    .querySelector(`#${makeId("lineHeight")}`)
    ?.addEventListener("input", (e: Event) => {
      onPrefsEvents("updatelineHeight");
    });

  doc
    .querySelector(`#${makeId("reset-titleTranslation")}`)
    ?.addEventListener("command", (e: Event) => {
      ztoolkit
        .getGlobal("ZoteroPane")
        .getSelectedItems()
        .forEach((item) => {
          ztoolkit.ExtraField.setExtraField(item, "titleTranslation", "");
        });
    });

  doc
    .querySelector(`#${makeId("reset-abstractTranslation")}`)
    ?.addEventListener("command", (e: Event) => {
      ztoolkit
        .getGlobal("ZoteroPane")
        .getSelectedItems()
        .forEach((item) => {
          ztoolkit.ExtraField.setExtraField(item, "abstractTranslation", "");
        });
    });
}

function updatePrefsPaneDefault() {
  onPrefsEvents("setEnablePopup", false);
  onPrefsEvents("setShowPlayBtn", false);
  onPrefsEvents("setSentenceSecret", false);
}

function onPrefsEvents(type: string, fromElement: boolean = true) {
  const doc = addon.data.prefs.window?.document;
  if (!doc) {
    return;
  }

  const setDisabled = (className: string, disabled: boolean) => {
    doc
      .querySelectorAll(`.${className}`)
      .forEach(
        (elem) => ((elem as XUL.Element & XUL.IDisabled).disabled = disabled),
      );
  };
  switch (type) {
    case "setAutoTranslateSelection":
      addon.hooks.onReaderTabPanelRefresh();
      break;
    case "setEnablePopup":
      {
        const elemValue = fromElement
          ? (doc.querySelector(`#${makeId("enablePopup")}`) as XUL.Checkbox)
              .checked
          : (getPref("enablePopup") as boolean);
        const hidden = !elemValue;
        setDisabled("enable-popup", hidden);
      }
      break;
    case "setShowPlayBtn":
      {
        const elemValue = fromElement
          ? (doc.querySelector(`#${makeId("showPlayBtn")}`) as XUL.Checkbox)
              .checked
          : (getPref("showPlayBtn") as boolean);
        const hidden = !elemValue;
        setDisabled("show-play-btn", hidden);
      }
      break;
    case "setSentenceService":
      {
        setPref(
          "translateSource",
          (
            doc.querySelector(`#${makeId("sentenceServices")}`) as XUL.MenuList
          ).getAttribute("value")!,
        );
        onPrefsEvents("setSentenceSecret", fromElement);
        addon.hooks.onReaderTabPanelRefresh();
      }
      break;
    case "updateSentenceSecret":
      {
        const serviceId = getPref("translateSource") as string;
        const inputElem = doc.querySelector(
          `#${makeId("sentenceServicesSecret")}`,
        ) as HTMLInputElement;
        const trimmedValue = inputElem.value.trim();
        if (trimmedValue !== inputElem.value) {
          inputElem.value = trimmedValue;
        }
        if (trimmedValue !== getServiceSecret(serviceId)) {
          setServiceSecret(serviceId, trimmedValue);
        }
      }
      break;
    case "setSentenceSecret":
      {
        const serviceId = getPref("translateSource") as string;
        const secretCheckResult = validateServiceSecret(
          serviceId,
          (validateResult) => {
            if (fromElement && !validateResult.status) {
              addon.data.prefs.window?.alert(
                `You see this because the translation service ${serviceId} requires SECRET, which is NOT correctly set.\n\nDetails:\n${validateResult.info}`,
              );
            }
          },
        );
        (
          doc.querySelector(
            `#${makeId("sentenceServicesSecret")}`,
          ) as HTMLInputElement
        ).value = secretCheckResult.secret;

        // Update secret status button
        const statusButton = doc.querySelector(
          `#${makeId("sentenceServicesStatus")}`,
        ) as XUL.Button;
        const service =
          addon.data.translate.services.getServiceById(serviceId)!;
        if (service.config) {
          statusButton.hidden = false;
          statusButton.label = getString("service-dialog-config");
          statusButton.onclick = (ev) => {
            createServiceSettingsDialog(service);
          };
        } else {
          statusButton.hidden = true;
        }
      }
      break;
    case "setSourceLanguage":
      {
        setPref(
          "sourceLanguage",
          (
            doc.querySelector(`#${makeId("langfrom")}`) as XUL.MenuList
          ).getAttribute("value")!,
        );
        addon.hooks.onReaderTabPanelRefresh();
      }
      break;
    case "setTargetLanguage":
      {
        setPref(
          "targetLanguage",
          (
            doc.querySelector(`#${makeId("langto")}`) as XUL.MenuList
          ).getAttribute("value")!,
        );
        addon.hooks.onReaderTabPanelRefresh();
      }
      break;
    case "updateFontSize":
      addon.api.getTemporaryRefreshHandler()();
      break;
    case "updatelineHeight":
      addon.api.getTemporaryRefreshHandler()();
      break;
    case "manageKeys":
      {
        import("../modules/settings/manageKeys").then(
          ({ manageKeysDialog }) => {
            manageKeysDialog();
          },
        );
      }
      break;
    case "renameServices":
      {
        import("../modules/settings/renameServices").then(
          ({ renameServicesDialog }) => {
            renameServicesDialog();
          },
        );
      }
      break;
    default:
      return;
  }
}

function makeId(type: string) {
  return `${config.addonRef}-${type}`;
}
