// Function to create the maze grid
export function createMazeGrid(rows, cols) {
  const maze = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        row: r,
        col: c,
        north: true,
        east: true,
        south: true,
        west: true,
        inMaze: false, // For Prim's algorithm
      });
    }
    maze.push(row);
  }
  return maze;
}

// Function to generate the maze using Prim's Algorithm
export function generateMaze(maze) {
  const rows = maze.length;
  const cols = maze[0].length;

  // Choose a random starting cell
  const startRow = Math.floor(Math.random() * rows);
  const startCol = Math.floor(Math.random() * cols);
  const startCell = maze[startRow][startCol];
  startCell.inMaze = true;

  const wallList = [];

  // Add the walls of the starting cell to the wall list
  addCellWallsToList(startCell, maze, wallList);

  while (wallList.length > 0) {
    // Pick a random wall from the list
    const randomIndex = Math.floor(Math.random() * wallList.length);
    const wall = wallList.splice(randomIndex, 1)[0];

    const { cellA, cellB, direction } = wall;

    if (!cellB.inMaze) {
      // Remove the wall between cellA and cellB
      cellA[direction] = false;
      const oppositeDirection = getOppositeDirection(direction);
      cellB[oppositeDirection] = false;

      // Mark cellB as part of the maze
      cellB.inMaze = true;

      // Add the walls of cellB to the wall list
      addCellWallsToList(cellB, maze, wallList);
    }
  }
}

// Helper function to add the walls of a cell to the wall list
function addCellWallsToList(cell, maze, wallList) {
  const moves = {
    north: [-1, 0],
    east: [0, 1],
    south: [1, 0],
    west: [0, -1],
  };

  for (const [direction, [dr, dc]] of Object.entries(moves)) {
    const newRow = cell.row + dr;
    const newCol = cell.col + dc;

    if (
      newRow >= 0 &&
      newRow < maze.length &&
      newCol >= 0 &&
      newCol < maze[0].length
    ) {
      const adjacentCell = maze[newRow][newCol];
      if (!adjacentCell.inMaze) {
        wallList.push({
          cellA: cell,
          cellB: adjacentCell,
          direction: direction,
        });
      }
    }
  }
}

// Helper function to get the opposite direction
function getOppositeDirection(direction) {
  const opposites = {
    north: "south",
    south: "north",
    east: "west",
    west: "east",
  };
  return opposites[direction];
}
