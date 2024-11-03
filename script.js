import { createMazeGrid, generateMaze } from "./mazeGenerator.js";

// Global variables
let mazeData = {};
let routeCells = [];
let currentStep = 0;
let animationInterval = null;
let isPaused = false;

// Main function to run when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  // Set up button event listeners
  document
    .getElementById("start-pause-button")
    .addEventListener("click", toggleAnimation);
  document
    .getElementById("restart-button")
    .addEventListener("click", restartMaze);
  document
    .getElementById("generate-button")
    .addEventListener("click", generateMazeFromInputs);
  document
    .getElementById("maze-file-input")
    .addEventListener("change", handleFileUpload);

  // Automatically generate a maze on page load
  generateMazeOnLoad();
});

// Function to generate a maze on page load
function generateMazeOnLoad() {
  const rows = 20; // Default rows
  const cols = 20; // Default columns
  generateNewMaze(rows, cols);
}

// Function to handle file upload
function handleFileUpload(event) {
  const file = event.target.files[0];
  if (file) {
    // Read the file content
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const uploadedMazeData = JSON.parse(e.target.result);

        // Validate the uploaded maze structure
        if (
          typeof uploadedMazeData.rows !== 'number' ||
          typeof uploadedMazeData.cols !== 'number' ||
          !uploadedMazeData.start ||
          !uploadedMazeData.goal ||
          !Array.isArray(uploadedMazeData.maze)
        ) {
          throw new Error("Invalid maze structure.");
        }

        mazeData = uploadedMazeData;

        // Display the maze and find the route
        displayMaze();
        findRoute();
        placeHouse();

        // Place the character at the start position
        placeCharacter(mazeData.start.row, mazeData.start.col, "front", false);

        // Hide the congratulations container
        const congratsContainer = document.getElementById("congrats-container");
        if (congratsContainer) {
          congratsContainer.style.display = "none";
          congratsContainer.classList.remove("show");
        }

        // Reset button text to "START"
        const startPauseButton = document.getElementById("start-pause-button");
        if (startPauseButton) {
          startPauseButton.textContent = "START";
        }

        // Clear the maze generator inputs to allow new uploads
        clearMazeGeneratorInputs();

        // Clear the file input to allow uploading another file
        clearFileInput();

        // Provide success feedback
        showMessage('Maze successfully loaded!');
        
      } catch (error) {
        console.error('Error parsing JSON:', error);
        showMessage('Failed to load maze. Please ensure the JSON file is correctly formatted.');
      }
    };
    reader.readAsText(file);
  }
}

function clearFileInput() {
  const fileInput = document.getElementById("maze-file-input");
  if (fileInput) {
    fileInput.value = ""; // Clears the selected file
  }
}

function clearMazeGeneratorInputs() {
  const rowsInput = document.getElementById("rows-input");
  const colsInput = document.getElementById("cols-input");
  if (rowsInput) rowsInput.value = "";
  if (colsInput) colsInput.value = "";
}

function generateMazeFromInputs() {
  const rowsInput = document.getElementById("rows-input");
  const colsInput = document.getElementById("cols-input");

  const rows = parseInt(rowsInput.value);
  const cols = parseInt(colsInput.value);

  // Validate input values
  if (isNaN(rows) || isNaN(cols) || rows < 5 || cols < 5) {
    showMessage("Please enter valid numbers for rows and columns (minimum 5).");
    return;
  }

  // Generate a new maze with the specified number of rows and columns
  generateNewMaze(rows, cols);

  clearFileInput();
}

// Function to generate a new maze using Prim's Algorithm
function generateNewMaze(rows, cols) {
  // Reset variables
  currentStep = 0;
  routeCells = [];
  isPaused = false;

  // Clear any existing character
  const existingCharacter = document.getElementById("character");
  if (existingCharacter) {
    existingCharacter.remove();
  }

  // Create the maze grid using functions from mazeGenerator.js
  const mazeGrid = createMazeGrid(rows, cols);

  // Generate the maze using Prim's Algorithm
  generateMaze(mazeGrid);

  // Set the maze data
  mazeData = {
    rows: rows,
    cols: cols,
    start: { row: 0, col: 0 },
    goal: { row: rows - 1, col: cols - 1 }, // Use 'goal' consistently
    maze: mazeGrid,
  };

  // Create an exit by removing the east wall of the goal cell
  const goalCell = mazeData.maze[mazeData.goal.row][mazeData.goal.col];
  goalCell.east = false;

  // Display the maze
  displayMaze();

  // Place the house at the goal position
  placeHouse();

  // Find the route
  findRoute();

  // Place the character at the start position in a stationary state
  placeCharacter(mazeData.start.row, mazeData.start.col, "front", false);

  // Hide the congratulations container
  const congratsContainer = document.getElementById("congrats-container");
  if (congratsContainer) {
    congratsContainer.style.display = "none";
    congratsContainer.classList.remove("show");
  }

  // Reset button text to "START"
  const startPauseButton = document.getElementById("start-pause-button");
  if (startPauseButton) {
    startPauseButton.textContent = "START";
  }

  // Clear the file input to allow new uploads
  clearFileInput();

  // Provide success feedback
  showMessage('New maze generated successfully!');
}

// Function to show messages using a modal
function showMessage(message) {
  const modal = document.getElementById("message-modal");
  const messageElem = document.getElementById("modal-message");
 // const closeButton = modal.querySelector(".close-button");

  messageElem.textContent = message;
  modal.style.display = "block";

  closeButton.onclick = () => {
    modal.style.display = "none";
  };

  window.onclick = (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  };
}

// Function to toggle animation
function toggleAnimation() {
  const startPauseButton = document.getElementById("start-pause-button");

  if (animationInterval) {
    // Animation is running, so pause it
    clearInterval(animationInterval);
    animationInterval = null;
    if (startPauseButton) {
      startPauseButton.textContent = "START";
    }
  } else {
    // Animation is not running, so start it
    if (currentStep >= routeCells.length) {
      currentStep = 0; // Reset to start if animation has finished
      clearRoute(); // Clear previous route highlights
      // Optionally, re-highlight the route up to currentStep
    }
    animationInterval = setInterval(animateCharacter, 200); // Adjust the delay as needed
    if (startPauseButton) {
      startPauseButton.textContent = "PAUSE";
    }
  }
  // Hide the congratulations container
  const congratsContainer = document.getElementById("congrats-container");
  if (congratsContainer) {
    congratsContainer.style.display = "none";
    congratsContainer.classList.remove("show");
  }
}

// Function to restart the maze
function restartMaze() {
  // Stop any ongoing animation
  clearInterval(animationInterval);
  animationInterval = null;

  // Reset variables
  currentStep = 0;
  //routeCells = [];

  // Clear any existing character
  const existingCharacter = document.getElementById("character");
  if (existingCharacter) {
    existingCharacter.remove();
  }

  // Place the character at the start position in a stationary state
  placeCharacter(mazeData.start.row, mazeData.start.col, "front", false);

  // Hide the congratulations container
  const congratsContainer = document.getElementById("congrats-container");
  if (congratsContainer) {
    congratsContainer.style.display = "none";
    congratsContainer.classList.remove("show");
  }

  // Reset button text to "START"
  const startPauseButton = document.getElementById("start-pause-button");
  if (startPauseButton) {
    startPauseButton.textContent = "START";
  }
  
  clearRoute();

}

// Function to animate the character moving through the maze
function animateCharacter() {
  if (currentStep >= routeCells.length) {
    clearInterval(animationInterval);
    animationInterval = null;

    // At the goal, display the character in a still position
    const { row, col } = routeCells[routeCells.length - 1];
    placeCharacter(row, col, "front", false);

    // Change the button text back to "START"
    const startPauseButton = document.getElementById("start-pause-button");
    if (startPauseButton) {
      startPauseButton.textContent = "START";
    }

    // Show the congratulations container
    const congratsContainer = document.getElementById("congrats-container");
    if (congratsContainer) {
      congratsContainer.style.display = "block"; // Make it participate in layout
      congratsContainer.classList.add("show"); // Trigger opacity transition
    }

    return;
  }

  const { row, col } = routeCells[currentStep];

  // Highlight the current cell
  const cellDiv = document.querySelector(
    `.cell[data-row='${row}'][data-col='${col}']`
  );
  if (cellDiv) {
    cellDiv.classList.add('route-cell'); // Add the CSS class to highlight
  }

  // Determine the direction
  let direction = "front"; // default direction
  if (currentStep > 0) {
    const prevCell = routeCells[currentStep - 1];
    if (row < prevCell.row) direction = "back"; // moving north
    else if (row > prevCell.row) direction = "front"; // moving south
    else if (col > prevCell.col) direction = "right"; // moving east
    else if (col < prevCell.col) direction = "left"; // moving west
  }

  // The character is moving
  placeCharacter(row, col, direction, true);

  currentStep++;
}

// Function to display the maze
function displayMaze() {
  const { rows, cols, maze, goal, start } = mazeData;
  const container = document.getElementById("maze-container");
  container.innerHTML = ""; // Clear previous maze if any
  container.style.gridTemplateRows = `repeat(${rows}, 32px)`;
  container.style.gridTemplateColumns = `repeat(${cols}, 32px)`; 

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cellData = maze[r][c];
      const cellDiv = document.createElement("div");
      cellDiv.classList.add("cell");
      cellDiv.dataset.row = r;
      cellDiv.dataset.col = c;

      // Create wall divs
      if (cellData.north) {
        const wallNorth = document.createElement("div");
        wallNorth.classList.add("wall", "wall-north");
        cellDiv.appendChild(wallNorth);
      }
      if (cellData.west) {
        const wallWest = document.createElement("div");
        wallWest.classList.add("wall", "wall-west");
        cellDiv.appendChild(wallWest);
      }

      // For the rightmost cells, render east walls
      if (c === cols - 1 && cellData.east) {
        const wallEast = document.createElement("div");
        wallEast.classList.add("wall", "wall-east");
        cellDiv.appendChild(wallEast);
      }

      // For the bottommost cells, render south walls
      if (r === rows - 1 && cellData.south) {
        const wallSouth = document.createElement("div");
        wallSouth.classList.add("wall", "wall-south");
        cellDiv.appendChild(wallSouth);
      }

      // Append the cell to the container
      container.appendChild(cellDiv);

      // Mark the start cell
      if (r === start.row && c === start.col) {
        const startMarker = document.createElement("div");
        startMarker.classList.add("marker", "start-marker");
        startMarker.innerText = "S"; // Or use an icon
        cellDiv.appendChild(startMarker);
      }

      // The goal marker (house) will be placed separately
      // to avoid overlapping with cell markers
    }
  }
}


// Function to place the house at the goal position
function placeHouse() {
  const { goal } = mazeData;
  if (!goal) {
    console.error('No goal defined in maze data.');
    return;
  }
  const container = document.getElementById("maze-container");
  let house = document.getElementById("house");

  // If the house element already exists, remove it to prevent duplicates
  if (house) {
    house.remove();
  }

  // Create a new house element
  house = document.createElement("img");
  house.id = "house";
  house.classList.add("house");
  house.src = "images/house.png"; // Ensure this path is correct
  container.appendChild(house);

  // Set the house size
  house.style.width = "64px"; // Adjusted to match cell size for consistency
  house.style.height = "73px";

  // Position the house in the extra column next to the goal cell
  house.style.position = "absolute";

  const cellSize = 32; // Size of your maze cells
  const x = (goal.col + 0.8) * cellSize; // Position in the extra column
  const y = (goal.row + -1.2) * cellSize; // Align vertically with the goal cell

  console.log(`Positioning house at left: ${x}px, top: ${y}px`);

  house.style.left = `${x}px`;
  house.style.top = `${y}px`;

  house.style.zIndex = 2; // Ensure the house appears above walls
}

// Function to place the character at a specific position
function placeCharacter(row, col, direction, isMoving) {
  console.log(`Placing character at row: ${row}, col: ${col}, direction: ${direction}, isMoving: ${isMoving}`);
  let character = document.getElementById("character");

  // If the character element doesn't exist, create it
  if (!character) {
    console.log("Character element not found. Creating a new one.");
    character = document.createElement("img");
    character.id = "character";
    character.classList.add("character");
    character.src = "images/character-front-still.png"; // Default image
    const container = document.getElementById("maze-container");
    container.appendChild(character);
  }

  // Determine the correct image based on direction and movement
  let imageName = "";

  if (isMoving) {
    // Alternate between walking images for animation
    const step = currentStep % 2; // 0 or 1
    switch (direction) {
      case "front":
        imageName = step === 0 ? "character-front-walk.png" : "character-front-still.png";
        break;
      case "back":
        imageName = step === 0 ? "character-back-walk.png" : "character-back-still.png";
        break;
      case "left":
        imageName = step === 0 ? "character-left-walk1.png" : "character-left-walk2.png";
        break;
      case "right":
        imageName = step === 0 ? "character-right-walk1.png" : "character-right-walk2.png";
        break;
      default:
        imageName = "character-front-still.png";
    }
  } else {
    // Use still images
    switch (direction) {
      case "front":
        imageName = "character-front-still.png";
        break;
      case "back":
        imageName = "character-back-still.png";
        break;
      case "left":
        imageName = "character-left-still.png";
        break;
      case "right":
        imageName = "character-right-still.png";
        break;
      default:
        imageName = "character-front-still.png";
    }
  }

  console.log(`Character image set to: images/${imageName}`);

  // Update the character's image
  character.src = `images/${imageName}`;

  // Position the character
  const cellSize = 32; // Ensure this matches the maze grid cell size
  character.style.top = `${row * cellSize}px`;
  character.style.left = `${col * cellSize}px`;
}

// Custom Stack implementation
class Stack {
  constructor() {
    this.items = [];
  }

  push(element) {
    this.items.push(element);
  }

  pop() {
    return this.items.pop();
  }

  isEmpty() {
    return this.items.length === 0;
  }

  size() {
    return this.items.length;
  }

  peek() {
    return this.items[this.items.length - 1];
  }

  toArray() {
    return [...this.items];
  }
}

// Function to find the route using Depth-First Search with backtracking
function findRoute() {
  const { maze, start, goal, rows, cols } = mazeData;

  if (!goal) {
    console.error("No goal defined in maze data.");
    alert("No goal defined in the maze.");
    return;
  }

  // Initialize visited matrix and previous cell tracker
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  const prev = Array.from({ length: rows }, () => Array(cols).fill(null));

  // Initialize the custom Stack and push the starting cell
  const stack = new Stack();
  stack.push({ row: start.row, col: start.col });
  visited[start.row][start.col] = true;

  // Define possible movements: north, east, south, west
  const moves = {
    north: [-1, 0],
    east: [0, 1],
    south: [1, 0],
    west: [0, -1],
  };

  // Clear any previous route highlights
  clearRoute();

  // Array to track dead-ends
  let deadEnds = [];

  // Perform DFS using the custom Stack
  while (!stack.isEmpty()) {
    const current = stack.pop();
    const { row, col } = current;

    console.log(`Visiting cell: row=${row}, col=${col}`);

    // Check if the goal has been reached
    if (row === goal.row && col === goal.col) {
      console.log("Goal reached:", current);
      break;
    }

    const cell = maze[row][col];
    let hasUnvisited = false;

    for (const [direction, [dr, dc]] of Object.entries(moves)) {
      if (!cell[direction]) { // No wall in this direction
        const newRow = row + dr;
        const newCol = col + dc;

        // Check boundaries and if the cell has been visited
        if (
          newRow >= 0 &&
          newRow < rows &&
          newCol >= 0 &&
          newCol < cols &&
          !visited[newRow][newCol]
        ) {
          visited[newRow][newCol] = true;
          prev[newRow][newCol] = { row, col };
          stack.push({ row: newRow, col: newCol });
          hasUnvisited = true;
          console.log(`Moving to cell: row=${newRow}, col=${newCol}`);
        }
      }
    }

    if (!hasUnvisited) {
      // Dead-end found
      deadEnds.push(current);
      console.log(`Dead-end at: row=${row}, col=${col}`);
    }
  }

  // Reconstruct the path from goal to start
  let path = [];
  let currentPathCell = { row: goal.row, col: goal.col };
  while (currentPathCell) {
    path.push(currentPathCell);
    currentPathCell = prev[currentPathCell.row][currentPathCell.col];
  }

  // Check for adjacency issues
  checkRouteAdjacency(path);

  // Check if a path exists
  if (
    path[path.length - 1].row !== start.row ||
    path[path.length - 1].col !== start.col
  ) {
    alert("No route found from start to goal!");
    return;
  }

  // Reverse the path to start from the beginning
  routeCells = path.reverse();

  console.log("Final routeCells:", routeCells);

  // Add the path from the goal to the house (one step beyond)
  routeCells.push({ row: goal.row, col: goal.col + 1 });

  // Highlight dead-ends in a different color
  deadEnds.forEach(cell => {
    const cellDiv = document.querySelector(
      `.cell[data-row='${cell.row}'][data-col='${cell.col}']`
    );
    if (cellDiv) {
      cellDiv.classList.add('dead-end-cell');
    }
  });

  // Optionally, log the path for debugging
  console.log("Route found:", routeCells);
  console.log("Dead-ends encountered:", deadEnds);
}

// Function to clear any previous route highlighting
function clearRoute() {
  const routeCellsElements = document.querySelectorAll('.route-cell');
  routeCellsElements.forEach(cell => {
    cell.classList.remove('route-cell');
  });
}

// Function to check route adjacency
function checkRouteAdjacency(routeCells) {
  for (let i = 1; i < routeCells.length; i++) {
    const prevCell = routeCells[i - 1];
    const currCell = routeCells[i];
    const rowDiff = Math.abs(currCell.row - prevCell.row);
    const colDiff = Math.abs(currCell.col - prevCell.col);
    if (rowDiff + colDiff !== 1) {
      console.warn(
        `Non-adjacent cells found between steps ${i - 1} and ${i}:`,
        prevCell,
        currCell
      );
    }
  }
}
