# Distributed P2P CMS Example - Frontend (for GraphDB Integration)

This project is a frontend prototype for a **Distributed Peer-to-Peer (P2P) Content Management System (dCMS)**. It demonstrates the user interface and client-side functionalities for creating, viewing, and managing content.

The dCMS is designed to operate on a decentralized P2P network, using a Graph Database (GDB) for data storage and real-time synchronization. The target backend library for achieving this is **`gdb-p2p`**, a minimalist Graph Database with P2P support. This README describes the frontend application and how it's intended to integrate with the `gdb-p2p` API.

## Core dCMS Frontend Features

This frontend, built with HTML, CSS, and JavaScript (`app.js`), provides the following user experiences:

*   **Post Listing (Grid View):** Displays all posts in a responsive image grid.
*   **Individual Post View:**
    *   Shows full post details: title, metadata (author, date - conceptual), image, and content.
    *   Renders Markdown content into HTML using Showdown.js.
*   **Post Creation & Editing:**
    *   A comprehensive form for creating new posts or editing existing ones.
    *   Fields include: Title, Slug (auto-generated from title, read-only), Short Description, Tags, Image URL, Status (Draft/Published), and Markdown Content.
    *   **Live Markdown Preview:** Real-time feedback on how Markdown content will render.
    *   **Word Count:** Dynamically updates for the Markdown content.
*   **Post Deletion:** Functionality to remove posts (accessible from the editor).
*   **Intuitive Navigation:** Simple menu to switch between viewing all posts and creating a new post.
*   **Responsive Design:** Adapts to various screen sizes.
*   **Latest Posts Footer:** Displays a list of recently updated posts.

## Intended Architecture with `gdb-p2p`

The true power of this dCMS will be realized when `app.js` is integrated with the `gdb-p2p` library. Here's how the frontend functionalities are designed to map to `gdb-p2p` operations:

1.  **Initialization:**
    *   Upon loading, `app.js` would initialize a `gdb-p2p` instance:
        ```javascript
        // In app.js
        // import { GraphDB } from "https://cdn.jsdelivr.net/npm/gdb-p2p/+esm"; // Or from npm
        const db = new GraphDB("dcms-main-database", { password: "user-chosen-password" /* optional */ });
        ```

2.  **Displaying Posts (Grid View & Latest Posts Footer):**
    *   The main post grid and the "Últimos Posts Actualizados" footer would be populated using `db.map()`.
    *   This allows for fetching posts with specific criteria (e.g., `status: 'published'`) and sorting (e.g., by modification date).
    *   Crucially, `db.map()`'s real-time callback (`({ id, value, action }) => { ... }`) would enable the UI to update automatically when posts are added, modified, or removed by any peer in the network.
        ```javascript
        // Example: Fetching published posts for the grid, sorted by creation time
        const { unsubscribe: unsubscribeGrid } = await db.map(
          { query: { type: "post", status: "published" }, field: "createdAt", order: "desc", realtime: true },
          handlePostUpdateForGrid // A function in app.js to update the DOM
        );
        ```

3.  **Viewing an Individual Post:**
    *   When a user clicks on a post, `app.js` would use `db.get(postId)` to retrieve the specific post's data.
        ```javascript
        const { result } = await db.get(selectedPostId);
        if (result) {
          displayPostDetails(result.value); // result.value contains the post object
        }
        ```

4.  **Creating/Editing Posts:**
    *   The "Nuevo Post" / "Editar Post" form submission would trigger `db.put(postData, postId?)`.
    *   For new posts, `db.put(postData)` creates a new node and returns its ID.
    *   For existing posts, `db.put(updatedPostData, existingPostId)` updates the node.
    *   Post data would include fields like `title`, `content`, `imageUrl`, `tags`, `status`, `createdAt`, `updatedAt`.
        ```javascript
        // Example: Saving a new post
        const newPost = { type: "post", title: "...", content: "...", status: "draft", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        const newPostId = await db.put(newPost);
        ```

5.  **Deleting Posts:**
    *   The "Eliminar Post" button would call `db.remove(postId)`.
        ```javascript
        await db.remove(postIdToDelete);
        ```

6.  **Tags & Relationships (Advanced Usage):**
    *   While tags can be stored as an array within the post object, a more robust graph approach would be to create separate nodes for tags and link them to posts using `db.link(postId, tagId, "has_tag")`. This allows for more powerful querying based on tag relationships.

7.  **P2P Collaboration Aspects:**
    *   `db.room.onPeerJoin` / `onPeerLeave` could be used to show active collaborators.
    *   `db.room.makeAction` could enable advanced features like synchronized cursors for multi-user editing of a post in the future.

## Tech Stack (Frontend)

*   **HTML5:** Semantic structure.
*   **CSS3:** Custom styling (`styles.css`).
*   **JavaScript (ES6+ Modules):** Application logic, DOM manipulation, and intended `gdb-p2p` integration (`app.js`).
*   **Showdown.js:** For client-side Markdown to HTML conversion (post content and live preview).

## Getting Started (Frontend Prototype)

### Prerequisites

*   A modern web browser.
*   (Optional) A local web server for development (recommended for ES6 modules).

### Running the Frontend Prototype

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-name>
    ```
2.  **Open `index.html`:**
    *   Directly in your browser: `file:///path/to/your/clone/index.html`
    *   Or using a local server (e.g., with Python):
        ```bash
        python -m http.server
        ```
        Then navigate to `http://localhost:8000`.

**Note:** This runs the frontend UI only. Data operations are currently simulated in `app.js` (e.g., using `localStorage` or in-memory arrays). Full P2P functionality requires integrating `gdb-p2p`.

## Project Structure

```
/
├── index.html        # Main HTML structure of the dCMS
├── styles.css        # CSS styles
├── app.js            # Core JavaScript logic (to be integrated with gdb-p2p)
└── README.md         # This file
```

## Future Development: Full `gdb-p2p` Integration

The primary next step for this project is to fully integrate `app.js` with the `gdb-p2p` library:

*   **Initialize `GraphDB`** on application start.
*   **Replace mock data handling** in `app.js` with `db.put()`, `db.get()`, `db.map()`, and `db.remove()` calls.
*   Implement **real-time UI updates** using the callback mechanism of `db.map()`.
*   Manage **post slugs**, ensuring uniqueness (potentially a check before `db.put()`).
*   Refine **data models** for posts, considering timestamps (using `gdb-p2p`'s HLCs automatically handled by `get` and `map` callbacks), authors, and tags.
*   Explore using `db.link()` for richer relationships (e.g., post-to-author, post-to-tag).
*   Implement **encryption** using the `password` option in `new GraphDB()` if secure storage is desired.

## Contributing

Contributions are welcome, especially those focused on the `gdb-p2p` integration and enhancing the P2P capabilities of the CMS.
1.  Fork the repository.
2.  Create a feature branch.
3.  Commit your changes.
4.  Push to the branch.
5.  Open a Pull Request.
