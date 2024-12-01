
# Password Generator Plugin

## Overview
The **Password Generator** plugin is a lightweight and customizable tool that helps users generate secure, random passwords directly within the Obsidian app. The plugin offers advanced options for password generation, evaluates password strength, and includes features like inserting passwords directly into notes.

---

## Features
- **Customizable Password Options**:
  - Set password length.
  - Include or exclude uppercase, lowercase, numbers, and special characters.
- **Advanced Strength Checker**:
  - Password strength is categorized as **Vulnerable**, **Weak**, or **Strong**.
  - Strength evaluation considers length, character diversity, and patterns.
- **Insert Password into Notes**:
  - Quickly add generated passwords to the active Obsidian note.
- **Responsive UI**:
  - Clean and intuitive interface with configurable advanced options.
- **Real-Time Updates**:
  - Password strength updates dynamically as you generate.

---

## Installation

### From the Obsidian Community Plugins
1. Open Obsidian.
2. Go to **Settings > Community Plugins**.
3. Search for "Password Generator" in the marketplace.
4. Click **Install** and enable the plugin.

### Manual Installation
1. Download the latest release from the [GitHub repository](https://github.com/Michle99/password-generator).
2. Extract the contents into your Obsidian vault's `plugins` folder:
``` 
 <YourVault>/.obsidian/plugins/obsidian-password-generator
```
3. Enable the plugin in **Settings > Community Plugins**.

---

## Usage

### Generating a Password
1. Open the Password Generator plugin from the **Ribbon** or **Command Palette**.
2. Adjust the options:
   - Set desired password length.
   - Toggle options for uppercase, lowercase, numbers, and special characters.
3. Click **Generate Password**.

### Inserting Password into Note
- After generating a password, click the **Insert Password** button to add it to the active note.

### Checking Password Strength
- The strength label updates in real-time as passwords are generated:
  - **Vulnerable**: Short or lacks character diversity.
  - **Weak**: Missing some diversity or moderate length.
  - **Strong**: Highly diverse and sufficiently long.

---

## Development Setup

To build and test the plugin locally:
1. Clone the repository:
   ```bash
   git clone https://github.com/Michle99/password-generator.git
   cd obsidian-password-generator
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the plugin:
   ```bash
   npm run build
   ```
4. Copy the `main.js`, `manifest.json`, and `styles.css` files to your `.obsidian/plugins/password-generator` folder.

---

## Roadmap
- Add support for saving generated passwords securely.
- Integrate with external password managers.
- Support multi-language interface.
- Add an option for passphrase generation.

---

## Contributing
Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a new branch for your feature:
   ```bash
   git checkout -b feature-name
   ```
3. Commit and push your changes.
4. Open a pull request on GitHub.

---

## License
This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).

---

## Support
If you encounter any issues or have feature requests, feel free to open an issue on the [GitHub repository](https://github.com/Michle99/password-generator). 

Happy password generating! 🎉

```
This `README.md` provides a detailed description of the Obsidian Password Generator plugin, its installation instructions, usage guidelines, and how to contribute. It is formatted in Markdown for easy integration into your GitHub project repository.
```