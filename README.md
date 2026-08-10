# MathBook 📓

Welcome to **MathBook**, a beautiful, fully interactive, reactive notebook environment for mathematics, computation, and programming. MathBook blends the expressive simplicity of a computational scratchpad with the power of first-class programming structures.

---

## ⚡ Getting Started

You can run MathBook either by downloading the pre-compiled desktop application or by setting it up locally for development.

### Method 1: Download the Desktop App (Windows)
For the most streamlined experience, you can download and run the pre-built installer:
1. Go to the [MathBook Releases](https://github.com/aniekandan/MathBook/releases) page.
2. Download the latest `.exe` installer (e.g., `MathBook-Setup.exe`).
3. Run the installer on your Windows machine to launch the interactive application.

### Method 2: Local Development Setup
To clone, run, and modify MathBook locally on your machine, follow these steps:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/aniekandan/MathBook.git
   cd MathBook
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the interactive development environment:**
   ```bash
   npm run dev
   ```

4. **Build the production web assets and server:**
   ```bash
   npm run build
   ```

5. **Package the desktop app locally (Windows):**
   ```bash
   npm run build:electron
   ```

---

## 🚀 Key Features

*   **Reactive Evaluation Engine**: Modifying a cell instantly re-calculates all downstream cells that reference its bound variables.
*   **Cell Auto-Renaming**: Assigning a value to a variable (e.g., `x = 4`) automatically renames the cell itself to `x`. No more manual cell renaming!
*   **First-Class Functions**: Functions are first-class citizens declared via clean lambda expressions (`func(x): x^2`) and can be assigned, passed around, and invoked dynamically.
*   **Rich Data Structures**: Built-in support for Numbers, Strings, Tuples, Lists, and Dictionaries, allowing you to represent complex data shapes directly.
*   **Markdown Integration**: Document your mathematical and logical proofs beautifully with interspersed rich text markdown blocks.

---

## 📖 Language Syntax & Data Types

The MathBook engine parses a highly-focused mathematical syntax with robust runtime representation.

### 1. Primitives

*   **Numbers**: Standard floating-point numbers.
    ```python
    x = 42
    y = 3.14159
    ```
*   **Strings**: Plain text delimited by single or double quotes.
    ```python
    message = "Hello, MathBook!"
    ```

### 2. Collections

*   **Tuples**: Read-only sequence of elements enclosed in parentheses. The primary operator supported is `+` for tuple concatenation.
    ```python
    coords = (1, 2, 3)
    merged = coords + (4, 5)  # Result: (1, 2, 3, 4, 5)
    ```
*   **Lists**: Ordered sequences of elements enclosed in square brackets.
    ```python
    my_list = [1, "two", (3, 4), [5]]
    ```
*   **Dictionaries**: Key-value collections mapping string or identifier keys to any value, enclosed in braces.
    ```python
    my_dict = { "status": "active", count: 100 }
    ```

### 3. First-Class Functions (`func`)

Functions are created using the `func` keyword followed by arguments and a body expression. They are fully-featured first-class values.

*   **Syntax**: `func(param1, param2, ...): expression`
*   **Assignment**: Assign a function to a variable to define it.
    ```python
    f = func(x): x^2 + 2*x + 1
    ```
*   **Invocation**: Call functions using their bound variable name.
    ```python
    f(5)  # Evaluates to 36
    ```

---

## ⚙️ Cell Auto-Renaming & Conflict Engine

MathBook features an automated symbol binder that syncs the visual UI with your code context:

1.  **Automatic Renaming**: When you enter a top-level assignment (e.g. `total = 500`), the cell's binder name is automatically updated to `total`.
2.  **Referential Renaming**: If you update a variable's name (e.g., renaming `f = func(x): x+1` to `g = func(x): x+1`), all references to that function or variable in other cells automatically update to match the new identifier name!
3.  **Strict Protection Checks**:
    *   **Duplicate Detection**: If you attempt to assign to a variable name that is already bound by another cell (e.g., trying to write `x = 10` when cell `x` already exists elsewhere), MathBook halts execution and prints an elegant error:
        `Variable name 'x' is already defined by another cell`
    *   **Reserved Keywords**: You cannot overwrite standard system constants or mathematical operators (e.g., `sin`, `cos`, `pi`, `e`, `tuple`, `func`).

---

## 💻 Keyboard & Interface Controls

*   **Run Cell**: Press `Shift + Enter` or click the play (`▶`) icon.
*   **Add Cell**: Hover between cells and click `+ Code` or `+ Markdown`.
*   **Move / Re-order**: Use the up and down arrow controls on the cell frame to swap execution order.
*   **Delete**: Click the trash can icon (`🗑️`) on the selected cell.
