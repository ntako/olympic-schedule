import Adw from 'gi://Adw';
import Gdk from 'gi://Gdk';
import GLib from 'gi://GLib';
import Gtk from 'gi://Gtk';
import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class OlympicRingsPreferences extends ExtensionPreferences {
  // fillPreferencesWindow(): build the preferences UI and wire the Save action.
  fillPreferencesWindow(window) {
    const settings = this.getSettings();

    const cssProvider = new Gtk.CssProvider();
    cssProvider.load_from_data(
      `
        .os-save-success {
          background: #2e7d32;
          color: #ffffff;
        }
      `,
      -1
    );
    Gtk.StyleContext.add_provider_for_display(
      Gdk.Display.get_default(),
      cssProvider,
      Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
    );

    const page = new Adw.PreferencesPage({
      title: 'Olympic Schedule',
      icon_name: 'preferences-system-symbolic',
    });

    const group = new Adw.PreferencesGroup({
      title: 'Impostazioni',
      description: 'Configura il codice NOC della nazione.',
    });

    const nocRow = new Adw.EntryRow({
      title: 'NOC',
      text: settings.get_string('noc'),
    });
    if (nocRow.set_placeholder_text) {
      nocRow.set_placeholder_text('ITA');
    }
    group.add(nocRow);

    const saveRow = new Adw.ActionRow({
      title: '',
      subtitle: '',
    });
    const saveButton = new Gtk.Button({
      label: 'Salva',
      valign: Gtk.Align.CENTER,
      css_classes: ['suggested-action'],
    });
    saveButton.connect('clicked', () => {
      const value = nocRow.text.trim().toUpperCase();
      if (value.length === 0) {
        saveRow.subtitle = 'Inserisci un NOC valido (es. ITA)';
        saveRow.remove_css_class('os-save-success');
        return;
      }

      settings.set_string('noc', value);
      saveRow.subtitle = 'Valore salvato';
      saveRow.add_css_class('os-save-success');

      if (this._saveFeedbackTimeoutId) {
        GLib.source_remove(this._saveFeedbackTimeoutId);
        this._saveFeedbackTimeoutId = 0;
      }

      this._saveFeedbackTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 2500, () => {
        saveRow.subtitle = '';
        saveRow.remove_css_class('os-save-success');
        this._saveFeedbackTimeoutId = 0;
        return GLib.SOURCE_REMOVE;
      });
    });
    saveRow.add_suffix(saveButton);

    group.add(saveRow);
    page.add(group);

    const infoGroup = new Adw.PreferencesGroup({
      title: 'Info',
    });

    const repoRow = new Adw.ActionRow({
      title: 'Repository',
      subtitle: 'Codice sorgente dell’estensione.',
    });
    const repoButton = new Gtk.LinkButton({
      label: 'Apri',
      uri: 'https://github.com/sydro/olympic-schedule',
    });
    repoRow.add_suffix(repoButton);
    infoGroup.add(repoRow);

    const dataRow = new Adw.ActionRow({
      title: 'Fonte dati',
      subtitle: 'Sito ufficiale Milano Cortina 2026.',
    });
    const dataButton = new Gtk.LinkButton({
      label: 'Apri',
      uri: 'https://www.olympics.com/en/milano-cortina-2026',
    });
    dataRow.add_suffix(dataButton);
    infoGroup.add(dataRow);

    page.add(infoGroup);
    window.add(page);
  }
}
