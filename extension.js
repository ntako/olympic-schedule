import Gio from 'gi://Gio';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

export default class OlympicRingsExtension extends Extension {
  enable() {
    this._button = new St.Button({
      style_class: 'panel-button olympic-rings-button',
      reactive: true,
      can_focus: true,
      track_hover: true,
    });
    this._button.set_style('padding: 0 6px;');

    this._icon = new St.Icon();
    this._icon.set_style('icon-size: 18px; width: 36px; height: 18px;');
    this._button.set_child(this._icon);

    this._menuManager = new PopupMenu.PopupMenuManager(this);
    this._menu = new PopupMenu.PopupMenu(this._button, 0.0, St.Side.TOP);
    this._menu.actor.hide();
    Main.uiGroup.add_child(this._menu.actor);
    this._menuManager.addMenu(this._menu);

    this._settingsItem = new PopupMenu.PopupMenuItem('Settings');
    this._settingsItem.connect('activate', () => {
      this.openPreferences();
    });
    this._menu.addMenuItem(this._settingsItem);

    this._buttonPressId = this._button.connect('button-press-event', (actor, event) => {
      const button = event.get_button();
      if (button === Clutter.BUTTON_SECONDARY) {
        this._menu.toggle();
        return Clutter.EVENT_STOP;
      }
      if (button === Clutter.BUTTON_PRIMARY) {
        this._menu.close();
        this._togglePopup();
        return Clutter.EVENT_STOP;
      }
      if (button === Clutter.BUTTON_MIDDLE) {
        return Clutter.EVENT_STOP;
      }
      return Clutter.EVENT_PROPAGATE;
    });
    this._buttonReleaseId = this._button.connect('button-release-event', (actor, event) => {
      const button = event.get_button();
      if (button === Clutter.BUTTON_PRIMARY || button === Clutter.BUTTON_SECONDARY || button === Clutter.BUTTON_MIDDLE) {
        return Clutter.EVENT_STOP;
      }
      return Clutter.EVENT_PROPAGATE;
    });

    Main.panel._rightBox.insert_child_at_index(this._button, 0);

    this._updateIcon();
    this._themeChangedId = Main.panel.actor.connect('style-changed', () => {
      this._updateIcon();
    });
  }

  disable() {
    this._hidePopup();

    if (this._buttonPressId) {
      this._button.disconnect(this._buttonPressId);
      this._buttonPressId = null;
    }
    if (this._buttonReleaseId) {
      this._button.disconnect(this._buttonReleaseId);
      this._buttonReleaseId = null;
    }

    if (this._themeChangedId) {
      Main.panel.actor.disconnect(this._themeChangedId);
      this._themeChangedId = null;
    }

    if (this._menu) {
      this._menu.destroy();
      this._menu = null;
    }
    this._menuManager = null;

    if (this._button) {
      this._button.destroy();
      this._button = null;
    }
    this._icon = null;
  }

  _updateIcon() {
    const bg = Main.panel.actor.get_theme_node().get_background_color();
    const luminance = (0.2126 * bg.red + 0.7152 * bg.green + 0.0722 * bg.blue) / 255;
    const ringVariant = luminance < 0.5 ? 'olympic-rings-white.svg' : 'olympic-rings.svg';
    const iconPath = `${this.path}/icons/${ringVariant}`;
    const gicon = Gio.icon_new_for_string(iconPath);
    this._icon.gicon = gicon;
  }

  _togglePopup() {
    if (this._popup) {
      this._hidePopup();
      return;
    }

    this._popup = new St.BoxLayout({
      style: 'background-color: rgba(0, 0, 0, 0.8); color: #fff; padding: 6px 10px; border-radius: 6px;',
      reactive: true,
    });
    const label = new St.Label({ text: 'Olympic Schedule' });
    this._popup.add_child(label);
    Main.uiGroup.add_child(this._popup);

    const [bx, by] = this._button.get_transformed_position();
    const [bw, bh] = this._button.get_transformed_size();
    const [minWidth] = this._popup.get_preferred_width(-1);
    const x = Math.round(bx + (bw - minWidth) / 2);
    const y = Math.round(by + bh + 6);
    this._popup.set_position(x, y);

    this._popupTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 2000, () => {
      this._hidePopup();
      return GLib.SOURCE_REMOVE;
    });
  }

  _hidePopup() {
    if (this._popupTimeoutId) {
      GLib.source_remove(this._popupTimeoutId);
      this._popupTimeoutId = null;
    }
    if (this._popup) {
      this._popup.destroy();
      this._popup = null;
    }
  }
}
