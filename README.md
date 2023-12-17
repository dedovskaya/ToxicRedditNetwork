# ToxicRedditNetwork
## About
ToxicRedditNetwork, a web application for visualizing and analyzing user data graphs is designed to depict user interactions within a network. The graph comprises nodes representing users and edges representing message exchanges. User properties, such as average toxicity score, message count, and average message length, are encoded in the nodes, while edges capture message toxicity scores and lengths. The application offers customization options to modify node and edge visuals based on their properties. Additionally, a clustering feature groups nodes using a force-directed graph algorithm. Our purpose is to provide a user-friendly tool for identifying toxic behavior, understanding communication patterns, and gaining insights into network dynamics through the analysis of user data graphs.

## Interface
The web application provides a canvas where the user data graph is rendered, accompanied by a menu featuring options on both sides of the screen. The graph is visually displayed, presenting nodes representing users and edges representing message exchanges between them. The graph is interactive, allowing manipulation for a better understanding of the data.
<p align="center">
  <img src="https://github.com/dedovskaya/ToxicRedditNetwork/assets/71874540/17fb0cf6-c8f7-4ddd-88a0-2f137bcb17d5" alt="Image" width="800" />
</p>

### Interactions
| Feature                    | Description                                              |
|----------------------------|----------------------------------------------------------|
| Upload File                | Upload data from the data folder.                         |
| Freeze graph               | Pause the force simulation by freezing the graph.         |
| Set colormap               | Choose a colormap from the defined color scheme.          |
| Node color dropdown        | Select a specific node property for node color.          |
| Node color picker          | Specify start and end colors for nodes based on property. |
| Edge color dropdown        | Choose a property for edge color.                         |
| Edge color picker          | Define start and end colors for edges based on property.  |
| Cluster Type dropdown      | Choose a specific node property for clustering.          |
| Set clusters               | Initiate clustering based on chosen value from dropdown.  |
| Node Radius Mode dropdown  | Select a value to determine the size of the nodes.        |
| Filter Edges dropdown      | Select property for filtering the edges.                  |
| Filter edges sliders       | Set min and max values for edge properties.               |

### Force Graph
| Parameter            | Description                                            |
|----------------------|--------------------------------------------------------|
| Gravity X            | Strength and direction of force along the X-axis.       |
| Gravity Y            | Strength and direction of force along the Y-axis.       |
| Repulsion Strength   | Strength of repulsive force between nodes.              |
| Link Strength        | Determines attractive force between connected nodes.   |
| Friction             | Controls damping effect on node movement.               |

### Appearance
| Setting               | Description                                            |
|-----------------------|--------------------------------------------------------|
| Show Graph            | Toggle visibility of the entire graph.                 |
| Show Links            | Choose to show or hide edges/links between nodes.      |
| Show Names            | Display or hide user names associated with nodes.      |
| Show Tooltips         | Enable or disable tooltips in the graph visualization. |
| Link Width            | Adjust thickness or width of edges/links connecting nodes. |
| Node Radius           | Control size of individual nodes representing users.  |
| Node Label Opacity    | Adjust transparency or opacity of user names on nodes. |

To launch the application double click on .html file

## Implementation
### Crawler
A crawler designed to fetch and analyze data from the Reddit platform. It is stored in /crawler folder. The fetch() method retrieves submissions from a specified subreddit using the PRAW (Python Reddit API
Wrapper) library. It iterates through the submissions, extracts relevant information such as submission ID, title, text, and associated user, and adds them to the data structure. The script includes several methods for calculating various metrics and performing data analysis. These methods include toxicity calculation, average user toxicity calculation, and average submission toxicity calculation. These calculations utilize the TextBlob library for sentiment analysis. 

### Web Application
**GraphRenderer.js** is responsible for rendering the graph visualization on the web page and providing functionality to update the visualization dynamically in response to user interactions or changes in the underlying data. This component manages the creation of nodes and edges based on the provided graph data, applying visual properties (such as colors, sizes, and labels) to nodes and edges, and rendering them on a canvas.

**interactions.js** handles user interactions and behaviors within the graph visualization. It includes functions and event handlers for user actions, such as toggling node or edge visibility and triggering specific operations or analysis on the graph.

**OpenFile.js** manages functionality related to opening and uploading graph data files in the web application.

**HTML and CSS files**: By double-clicking on the .html file, the user can launch the application.
## Screenshots
<p align="center">
  <img src="https://github.com/dedovskaya/ToxicRedditNetwork/assets/71874540/d8157a8a-a299-4cac-98a8-77f2742b4d07" alt="Screenshot1" width="800" />
</p>
<p align="center">
  <img src="https://github.com/dedovskaya/ToxicRedditNetwork/assets/71874540/71ec9bc5-51fd-4cd9-9df3-a9e9fafbe17d" alt="Screenshot2" width="800" />
</p>
<p align="center">
  <img src="https://github.com/dedovskaya/ToxicRedditNetwork/assets/71874540/6714ec81-89bb-440d-848e-a1dfc7d9c937" alt="Screenshot3" width="800" />
</p>
<p align="center">
  <img src="https://github.com/dedovskaya/ToxicRedditNetwork/assets/71874540/81889d1d-2c6b-422e-8936-da06949b4dc2" alt="Screenshot4" width="800" />
</p>

## Authors
This project is a group work done in Visual Analytics course. Authors:
- Ekaterina Baikova
- Alexander Schuc
- Vishnu Viswambharan
- Nathaniel Benkö
  
TUGraz, 2023
