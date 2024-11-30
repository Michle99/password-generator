/* eslint-disable no-control-regex */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/main.ts
import {
    App,
    Modal,
    Notice,
    Plugin,
    PluginSettingTab,
    Setting,
    ButtonComponent,
    MarkdownView,
} from 'obsidian';
import zxcvbn from 'zxcvbn'; // Ensure zxcvbn is installed as a dependency

// ==============================
// Interfaces and Default Settings
// ==============================

interface PasswordGeneratorSettings {
    defaultLength: number;
    useUppercase: boolean;
    useNumbers: boolean;
    useSymbols: boolean;
    excludeSimilar: boolean;
    includePattern: boolean;
    pattern: string;
}

const DEFAULT_SETTINGS: PasswordGeneratorSettings = {
    defaultLength: 12,
    useUppercase: true,
    useNumbers: true,
    useSymbols: true,
    excludeSimilar: false,
    includePattern: false,
    pattern: '',
};

// ==============================
// Password Generator Class
// ==============================

class PasswordGenerator {
    public settings: PasswordGeneratorSettings;

    constructor(settings: PasswordGeneratorSettings) {
        this.settings = settings;
    }

    generatePassword(): string {
        if (this.settings.includePattern && this.settings.pattern.trim() !== '') {
            return this.generatePatternPassword(this.settings.pattern);
        }
        return this.generateRandomPassword();
    }

    private generateRandomPassword(): string {
        const lower = "abcdefghijklmnopqrstuvwxyz";
        const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const numbers = "0123456789";
        const symbols = "!@#$%^&*()_+-=[]{}|;':\",./<>?";

        let characterSet = lower;
        if (this.settings.useUppercase) characterSet += upper;
        if (this.settings.useNumbers) characterSet += numbers;
        if (this.settings.useSymbols) characterSet += symbols;

        if (this.settings.excludeSimilar) {
            characterSet = this.excludeSimilarCharacters(characterSet);
        }

        if (!characterSet.length) {
            throw new Error("No characters available to generate password.");
        }

        let password = '';
        const cryptoObj = window.crypto || (window as any).msCrypto;

        for (let i = 0; i < this.settings.defaultLength; i++) {
            const array = new Uint32Array(1);
            cryptoObj.getRandomValues(array);
            const randomIndex = array[0] % characterSet.length;
            password += characterSet[randomIndex];
        }
        return password;
    }

    private generatePatternPassword(pattern: string): string {
        let password = '';
        const cryptoObj = window.crypto || (window as any).msCrypto;

        for (const char of pattern) {
            switch (char.toUpperCase()) {
                case 'L':
                    password += this.getRandomCharacter("abcdefghijklmnopqrstuvwxyz", cryptoObj);
                    break;
                case 'U':
                    password += this.getRandomCharacter("ABCDEFGHIJKLMNOPQRSTUVWXYZ", cryptoObj);
                    break;
                case 'D':
                    password += this.getRandomCharacter("0123456789", cryptoObj);
                    break;
                case 'S':
                    password += this.getRandomCharacter("!@#$%^&*()_+-=[]{}|;':\",./<>?", cryptoObj);
                    break;
                default:
                    password += char;
            }
        }

        return password;
    }

    private getRandomCharacter(charSet: string, cryptoObj: Crypto): string {
        const array = new Uint32Array(1);
        cryptoObj.getRandomValues(array);
        const randomIndex = array[0] % charSet.length;
        return charSet[randomIndex];
    }

    private excludeSimilarCharacters(charSet: string): string {
        const similarChars = /[0O1lI|]/g;
        return charSet.replace(similarChars, '');
    }

    /**
     * Calculates entropy in bits based on zxcvbn's guesses_log10.
     * @param password - The password to evaluate.
     * @returns Entropy in bits.
     */
    getEntropy(password: string): number {
        const hasLower = /[a-z]/.test(password);
        const hasUpper = /[A-Z]/.test(password);
        const hasDigits = /\d/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        // Base entropy derived from zxcvbn (captures common password patterns)
        const result = zxcvbn(password);
        const baseEntropy = Math.log2(result.guesses);

        // Calculate character diversity
        const diversityScore = [hasLower, hasUpper, hasDigits, hasSpecial].filter(Boolean).length;

        // Apply length and diversity rules to designate vulnerability
        if (password.length < 10 && diversityScore < 4) {
            return baseEntropy - 10; // Penalize for being short and lacking diversity
        }

        if (password.length >= 14) {
            return baseEntropy + 15; // Bonus for being long
        }

        if (diversityScore === 4) {
            return baseEntropy + 5; // Bonus for full diversity
        }

        return baseEntropy; // Default entropy
    }

    /**
     * Counts the number of character sets used based on settings.
     * Lowercase is always included.
     * @returns Number of character sets used.
     */
    getCharacterSetCount(): number {
        let count = 1; // Lowercase is always included
        if (this.settings.useUppercase) count++;
        if (this.settings.useNumbers) count++;
        if (this.settings.useSymbols) count++;
        return count;
    }
}

// ==============================
// Strength Label Function
// ==============================

/**
 * Determines the strength label based on entropy and feedback from zxcvbn.
 * @param password - The password to evaluate.
 * @returns A string representing the password strength.
 */
    function getStrengthLabel(password: string): string {
        const hasLower = /[a-z]/.test(password);
        const hasUpper = /[A-Z]/.test(password);
        const hasDigits = /\d/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        const length = password.length;

        // Diversity score (number of character types present)
        const diversityScore = [hasLower, hasUpper, hasDigits, hasSpecial].filter(Boolean).length;

        if (length < 10 && diversityScore < 4) {
            return "Vulnerable";
        }

        if (length >= 14 && diversityScore === 4) {
            return "Strong";
        }

        if (length < 14 || diversityScore < 4) {
            return "Weak";
        }

        return "Moderate"; // Edge case not covered above
    }

// ==============================
// Password Modal Class
// ==============================

class PasswordModal extends Modal {
    private generator: PasswordGenerator;
    public password = '';
    public entropy = 0;
    private strengthLabelElement?: HTMLElement; // To update strength label dynamically
    private advancedOptionsVisible = false; // Track the state of advanced options

    constructor(app: App, settings: PasswordGeneratorSettings) {
        super(app);
        this.generator = new PasswordGenerator(settings);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        this.generateNewPassword();

        // Create a container for better CSS scoping
        const container = contentEl.createDiv({ cls: 'pgp-modal-content' });

        // Header
        container.createEl('h2', { text: 'Generate Password' });

        // Password Display Section
        const passwordSection = container.createDiv({ cls: 'pgp-password-section' });

        const passwordInput = passwordSection.createEl('input', {
            cls: 'pgp-password-input',
            attr: {
                type: 'password',
                value: this.password,
                readonly: 'true' // Set as string
            }
        });

        passwordInput.style.marginBottom = '10px';

        // Visibility Toggle
        const visibilityToggle = passwordSection.createEl('button', { cls: 'pgp-visibility-toggle', text: 'Show' });
        visibilityToggle.style.marginBottom = '10px';
        visibilityToggle.addEventListener('click', () => {
            const currentType = passwordInput.getAttribute('type');
            if (currentType === 'password') {
                passwordInput.setAttribute('type', 'text');
                visibilityToggle.textContent = 'Hide';
            } else {
                passwordInput.setAttribute('type', 'password');
                visibilityToggle.textContent = 'Show';
            }
        });

        // Strength Label
        // const characterSetCount = this.generator.getCharacterSetCount();
        // const strengthLabel = getStrengthLabel(this.entropy, characterSetCount);
        this.strengthLabelElement = container.createEl('p', { text: `Strength: ${getStrengthLabel(this.password)}`, cls: `pgp-strength-label ${getStrengthLabel(this.password).toLowerCase()}` });

        // Button Container
        const buttonContainer = container.createDiv({ cls: 'pgp-button-container' });

        // Copy Button
        new ButtonComponent(buttonContainer)
            .setButtonText('Copy')
            .setIcon('copy')
            .setTooltip('Copy the generated password to clipboard')
            .onClick(async () => {
                try {
                    await navigator.clipboard.writeText(this.password);
                    passwordInput.addClass('copied');
                    setTimeout(() => passwordInput.removeClass('copied'), 500);
                    new Notice('Password copied to clipboard', 2000);
                } catch (error) {
                    new Notice('Failed to copy password', 2000);
                }
            });

        // Regenerate Button
        new ButtonComponent(buttonContainer)
            .setButtonText('Regenerate')
            .setIcon('refresh-cw')
            .setTooltip('Generate a new password')
            .onClick(() => {
                this.generateNewPassword();
                passwordInput.value = this.password;
                // Update Strength Label
                // const newCharacterSetCount = this.generator.getCharacterSetCount();
                const newStrengthLabel = getStrengthLabel(this.password);
                if (this.strengthLabelElement) {
                    this.strengthLabelElement.textContent = `Strength: ${newStrengthLabel}`;
                    // Update Strength Label Color
                    this.strengthLabelElement.classList.remove('vulnerable', 'weak', 'strong');
                    this.strengthLabelElement.classList.add(newStrengthLabel.toLowerCase());
                }
            });

        // Insert Button
        const insertButton = new ButtonComponent(buttonContainer)
            .setButtonText('Insert')
            .setIcon('plus-circle')
            .setTooltip('Insert the password into the active note')
            .onClick(() => {
                this.insertPasswordIntoActiveView();
                new Notice('Password inserted into note', 2000);
                this.close();
            });
            
        
        // Add space before advanced options
        container.createDiv({ cls: 'pgp-spacing' }); // Add a spacer div

        // ==============================
        // Advanced Options Toggle
        // ==============================

        const advancedToggle = container.createEl('button', {
            text: 'Advanced Options',
            cls: 'pgp-advanced-toggle',
        });

        const advancedOptionsContainer = container.createDiv({
            cls: 'pgp-advanced-options',
            attr: { style: 'display: none;' }, // Hide advanced options by default
        });

        // Add event listener to the toggle
        advancedToggle.addEventListener('click', () => {
            this.advancedOptionsVisible = !this.advancedOptionsVisible;
            advancedOptionsContainer.style.display = this.advancedOptionsVisible ? 'block' : 'none';
        });

        // Length Setting
        new Setting(advancedOptionsContainer)
            .setName('Password Length')
            .addSlider(slider => {
                slider.setLimits(8, 32, 1)
                    .setValue(this.generator.settings.defaultLength)
                    .onChange((value) => {
                        this.generator.settings.defaultLength = value;
                    })
                    .setDynamicTooltip();
            });

        // Uppercase Letters Setting
        new Setting(advancedOptionsContainer)
            .setName('Include Uppercase Letters')
            .addToggle(toggle => {
                toggle.setValue(this.generator.settings.useUppercase)
                    .onChange(value => {
                        this.generator.settings.useUppercase = value;
                    });
            });

        // Numbers Setting
        new Setting(advancedOptionsContainer)
            .setName('Include Numbers')
            .addToggle(toggle => {
                toggle.setValue(this.generator.settings.useNumbers)
                    .onChange(value => {
                        this.generator.settings.useNumbers = value;
                    });
            });

        // Symbols Setting
        new Setting(advancedOptionsContainer)
            .setName('Include Symbols')
            .addToggle(toggle => {
                toggle.setValue(this.generator.settings.useSymbols)
                    .onChange(value => {
                        this.generator.settings.useSymbols = value;
                    });
            });

        // Exclude Similar Characters Setting
        new Setting(advancedOptionsContainer)
            .setName('Exclude Similar Characters (e.g., 0 and O)')
            .addToggle(toggle => {
                toggle.setValue(this.generator.settings.excludeSimilar)
                    .onChange(value => {
                        this.generator.settings.excludeSimilar = value;
                    });
            });

        // Pattern-based password setting
        new Setting(advancedOptionsContainer)
            .setName('Use a Custom Pattern')
            .addToggle(toggle => {
                toggle.setValue(this.generator.settings.includePattern)
                    .onChange(value => {
                        this.generator.settings.includePattern = value;
                    });
            });

        new Setting(advancedOptionsContainer)
            .setName('Pattern')
            .addText(text => {
                text.setPlaceholder('Enter a custom pattern (L, U, D, S)')
                    .setValue(this.generator.settings.pattern)
                    .onChange(value => {
                        this.generator.settings.pattern = value;
                    });
            });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }

    private generateNewPassword() {
        this.password = this.generator.generatePassword();
        this.entropy = this.generator.getEntropy(this.password);
    }

    private insertPasswordIntoActiveView() {
        const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (markdownView) {
            const editor = markdownView.editor;
            const cursor = editor.getCursor();
            editor.replaceRange(this.password, cursor);
        } else {
            new Notice('No active note found to insert password.', 2000);
        }
    }
}

// ==============================
// Main Plugin Class
// ==============================

export default class PasswordGeneratorPlugin extends Plugin {
    settings: PasswordGeneratorSettings;

    async onload() {
        console.log('Loading Password Generator Plugin');
        await this.loadSettings();

        // Command to open the Password Modal
        this.addCommand({
            id: 'open-password-generator',
            name: 'Generate Password',
            callback: () => {
                new PasswordModal(this.app, this.settings).open();
            }
        });
    }

    onunload() {
        console.log('Unloading Password Generator Plugin');
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}
