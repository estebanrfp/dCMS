import { GDB } from 'https://cdn.jsdelivr.net/npm/gdb-p2p/+esm'

// --- Slug Generation Functions ---
function removeStopWords (text, lang = 'es') {
  // Note: This stopword list is for Spanish. Translating it would change the function's behavior.
  const stopwords_es = new Set([
    'un', 'una', 'unas', 'unos', 'uno', 'sobre', 'todo', 'también', 'tras', 'otro', 'algún', 'alguno', 'alguna', 'algunos', 'algunas',
    'ser', 'es', 'soy', 'eres', 'somos', 'sois', 'son', 'fui', 'fuiste', 'fue', 'fuimos', 'fuisteis', 'fueron',
    'haber', 'he', 'has', 'ha', 'hemos', 'habéis', 'han', 'haya', 'hubo',
    'estar', 'estoy', 'estás', 'está', 'estamos', 'estáis', 'están',
    'tener', 'tengo', 'tienes', 'tiene', 'tenemos', 'tenéis', 'tienen',
    'el', 'la', 'lo', 'los', 'las', 'su', 'sus', 'tu', 'tus', 'mi', 'mis',
    'de', 'en', 'desde', 'por', 'para', 'con', 'sin', 'a', 'ante', 'bajo', 'cabe', 'contra',
    'hacia', 'hasta', 'mediante', 'según', 'so',
    'yo', 'tú', 'él', 'ella', 'nosotros', 'vosotros', 'ellos', 'ellas',
    'o', 'y', 'e', 'u', 'pero', 'porque', 'pues', 'como', 'más', 'aunque', 'mientras', 'si',
    'qué', 'quién', 'quienes', 'cuál', 'cuáles', 'cuyo', 'cuya', 'cuyos', 'cuyas', 'cuándo', 'dónde', 'cómo', 'cuánto',
    'tal', 'vez', 'muy', 'mucho', 'poco', 'todo', 'nada', 'algo', 'varios',
    'le', 'les', 'me', 'te', 'se', 'nos', 'os'
  ])

  let words
  if (lang === 'es') {
    words = text.toLowerCase().split(/\s+/)
    return words.filter(word => !stopwords_es.has(word)).join(' ')
  }
  return text
}

function advancedSlugify (str) {
  if (!str) return ''
  str = removeStopWords(str, 'es') // Uses Spanish stopwords by default
  str = str.replace(/^\s+|\s+$/g, '')
  str = str.toLowerCase()

  const from = 'àáäâèéëêìíïîòóöôùúüûñç·/_,:;'
  const to = 'aaaaeeeeiiiioooouuuunc------'
  for (let i = 0, l = from.length; i < l; i++) {
    str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i))
  }

  str = str.replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
  return str
}

// --- Word Count Function ---
function countWords (text) {
  if (!text || text.trim() === '') return 0
  const words = text.match(/[\wÀ-ÖØ-öø-ÿ]+/g)
  return words ? words.length : 0
}

document.addEventListener('DOMContentLoaded', () => {
  const markdownConverter = new showdown.Converter({
    tables: true,
    strikethrough: true,
    tasklists: true,
    simpleLineBreaks: true
  })

  const db = new GDB('cms-advanced-v2-db')

  // --- DOM Elements ---
  const navViewListBtn = document.getElementById('navViewList')
  const navNewPostBtn = document.getElementById('navNewPost')

  const postListSection = document.getElementById('postListSection')
  const postViewSection = document.getElementById('postViewSection')
  const editorSection = document.getElementById('editorSection')

  const postsGridContainer = document.getElementById('postsGridContainer')
  const latestPostsListUl = document.getElementById('latestPostsList')

  const postForm = document.getElementById('postForm')
  const editorTitleEl = document.getElementById('editorTitle')
  const titleInput = document.getElementById('title')
  const slugInput = document.getElementById('slug')
  const descriptionInput = document.getElementById('description')
  const tagsInput = document.getElementById('tags')
  const imageUrlInput = document.getElementById('imageUrl')
  const statusInput = document.getElementById('status')
  const contentInput = document.getElementById('content')
  const deletePostBtn = document.getElementById('deletePostBtn')
  const backToListViewFromEditorBtn = document.getElementById('backToListViewFromEditor')

  const markdownPreview = document.getElementById('markdownPreview')
  const wordCountSpan = document.getElementById('wordCount')

  const postViewTitle = document.getElementById('postViewTitle')
  const postViewMeta = document.getElementById('postViewMeta')
  const postViewImage = document.getElementById('postViewImage')
  const postViewContent = document.getElementById('postViewContent')
  const backToListViewFromPostBtn = document.getElementById('backToListViewFromPost')

  let currentEditingPostId = null
  let currentEditingContentId = null
  let unsubscribeMainGrid = null
  let unsubscribeLatestPosts = null
  const IMAGE_PLACEHOLDER = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22200%22%20height%3D%22150%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20200%20150%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_17ba862586c%20text%20%7B%20fill%3A%23AAAAAA%3Bfont-weight%3Abold%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A13pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_17ba862586c%22%3E%3Crect%20width%3D%22200%22%20height%3D%22150%22%20fill%3D%22%23EEEEEE%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2272.171875%22%20y%3D%2281%22%3EImage%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E'


  // --- Application State & Routing ---
  function showSection (sectionToShow) {
    [postListSection, postViewSection, editorSection].forEach(section => {
      section.style.display = 'none'
    })
    if (sectionToShow) {
      // editorSection uses display: grid defined in CSS via .editor-layout
      // the others can use block or the default display of <section>
      sectionToShow.style.display = sectionToShow.classList.contains('editor-layout') ? 'grid' : 'block'
    }
  }

  function handleRouteChange () {
    const hash = window.location.hash

    if (hash.startsWith('#/post/')) {
      const postId = hash.substring('#/post/'.length)
      loadAndDisplayPost(postId)
    } else if (hash.startsWith('#/editor/')) {
      const postId = hash.substring('#/editor/'.length)
      loadPostForEditing(postId)
    } else if (hash === '#/editor') {
      resetEditorForm()
      editorTitleEl.textContent = 'Create New Post'
      deletePostBtn.style.display = 'none'
      wordCountSpan.textContent = '0'
      showSection(editorSection)
    } else {
      if (hash !== '#/') {
        window.location.hash = '#/'
        return
      }
      resetEditorForm()
      subscribeToMainGridPosts()
      showSection(postListSection)
    }
    subscribeToLatestPosts()
  }

  navViewListBtn.addEventListener('click', (e) => { e.preventDefault(); window.location.hash = '#/' })
  navNewPostBtn.addEventListener('click', (e) => { e.preventDefault(); window.location.hash = '#/editor' })
  backToListViewFromEditorBtn.addEventListener('click', () => window.location.hash = '#/')
  backToListViewFromPostBtn.addEventListener('click', () => window.location.hash = '#/')

  // --- Editor Logic ---
  titleInput.addEventListener('input', () => {
    slugInput.value = advancedSlugify(titleInput.value)
  })

  contentInput.addEventListener('input', () => {
    const markdownText = contentInput.value
    markdownPreview.innerHTML = markdownConverter.makeHtml(markdownText)
    wordCountSpan.textContent = countWords(markdownText)
  })

  function resetEditorForm () {
    postForm.reset()
    slugInput.value = ''
    currentEditingPostId = null
    currentEditingContentId = null
    editorTitleEl.textContent = 'Create New Post'
    deletePostBtn.style.display = 'none'
    markdownPreview.innerHTML = ''
    wordCountSpan.textContent = '0'
  }

  postForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    if (!imageUrlInput.value) {
      alert('Please enter a URL for the image.')
      imageUrlInput.focus()
      return
    }

    const isEditing = !!currentEditingPostId
    let originalCreatedAt = Date.now()
    if (isEditing) {
      try {
        const { result: existingPostNode } = await db.get(currentEditingPostId)
        if (existingPostNode && existingPostNode.value && existingPostNode.value.createdAt) {
          originalCreatedAt = existingPostNode.value.createdAt
        }
      } catch (err) { console.warn('Could not get original createdAt:', err) }
    }

    const postMetaData = {
      title: titleInput.value,
      slug: slugInput.value || advancedSlugify(titleInput.value),
      description: descriptionInput.value,
      tags: tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag),
      imageUrl: imageUrlInput.value,
      status: statusInput.value,
      type: 'postMeta', // Internal type, do not translate
      createdAt: originalCreatedAt,
      updatedAt: Date.now()
    }
    const contentData = { markdown: contentInput.value, type: 'postContent' } // Internal type

    try {
      let contentNodeId
      if (isEditing && currentEditingContentId) {
        await db.put(contentData, currentEditingContentId)
        contentNodeId = currentEditingContentId
      } else {
        contentNodeId = await db.put(contentData)
      }

      postMetaData.contentId = contentNodeId

      let metaNodeId
      if (isEditing) {
        await db.put(postMetaData, currentEditingPostId)
        metaNodeId = currentEditingPostId
        alert('Post updated!')
      } else {
        metaNodeId = await db.put(postMetaData)
        await db.link(metaNodeId, contentNodeId)
        alert('Post created!')
      }
      window.location.hash = `#/post/${metaNodeId}`
    } catch (error) {
      console.error('Error saving post:', error)
      alert(`Error saving: ${error.message}`)
    }
  })

  deletePostBtn.addEventListener('click', async () => {
    if (!currentEditingPostId || !confirm('Are you sure you want to delete this post?')) return
    try {
      const { result: metaNodeToDelete } = await db.get(currentEditingPostId)
      if (metaNodeToDelete && metaNodeToDelete.value && metaNodeToDelete.value.contentId) {
        await db.remove(metaNodeToDelete.value.contentId)
      }
      await db.remove(currentEditingPostId)
      alert('Post deleted.')
      window.location.hash = '#/'
    } catch (error) {
      console.error('Error deleting post:', error)
      alert(`Error deleting: ${error.message}`)
    }
  })

  async function loadPostForEditing (postId) {
    try {
      const { result: metaNode } = await db.get(postId)
      if (!metaNode || !metaNode.value) {
        alert('Post not found for editing.'); window.location.hash = '#/'; return
      }
      const postMeta = metaNode.value
      resetEditorForm()
      editorTitleEl.textContent = 'Edit Post'
      currentEditingPostId = postId
      titleInput.value = postMeta.title || ''
      slugInput.value = postMeta.slug || advancedSlugify(postMeta.title || '')
      descriptionInput.value = postMeta.description || ''
      tagsInput.value = postMeta.tags ? postMeta.tags.join(', ') : ''
      imageUrlInput.value = postMeta.imageUrl || ''
      statusInput.value = postMeta.status || 'draft' // 'draft' is an internal value

      let markdownText = ''
      if (postMeta.contentId) {
        currentEditingContentId = postMeta.contentId
        const { result: contentNode } = await db.get(postMeta.contentId)
        markdownText = (contentNode && contentNode.value && typeof contentNode.value.markdown !== 'undefined') ? contentNode.value.markdown : ''
      } else {
        currentEditingContentId = null
      }
      contentInput.value = markdownText
      markdownPreview.innerHTML = markdownConverter.makeHtml(markdownText)
      wordCountSpan.textContent = countWords(markdownText)

      deletePostBtn.style.display = 'inline-block'
      showSection(editorSection)
    } catch (error) {
      console.error('Error loading post for editing:', error)
      alert(`Error loading for editing: ${error.message}`); window.location.hash = '#/'
    }
  }

  // --- MAIN Post List Logic (Image Grid) ---
  async function subscribeToMainGridPosts () {
    if (unsubscribeMainGrid) { unsubscribeMainGrid(); unsubscribeMainGrid = null }

    postsGridContainer.innerHTML = '<p>Loading posts...</p>'

    try {
      const { results, unsubscribe } = await db.map(
        {
          query: { type: 'postMeta' }, // Internal type
          field: 'updatedAt',
          order: 'desc' // Internal order
        },
        ({ id, value, action }) => {
          const loadingMsg = postsGridContainer.querySelector('p:first-child')
          if (loadingMsg && loadingMsg.textContent.startsWith('Loading')) postsGridContainer.innerHTML = ''

          const existingEl = postsGridContainer.querySelector(`.post-grid-item[data-id="${id}"]`)

          if (action === 'removed') {
            if (existingEl) existingEl.remove()
          } else if (value) {
            if (existingEl) updatePostGridItemDOM(existingEl, value)
            else {
              const newEl = createPostGridItemDOM(id, value)
              postsGridContainer.appendChild(newEl)
            }
          }

          if (postsGridContainer.children.length === 0 && !postsGridContainer.querySelector('p')) {
            postsGridContainer.innerHTML = '<p>No posts yet. Create one!</p>'
          }
        }
      )
      unsubscribeMainGrid = unsubscribe

      if (postsGridContainer.textContent.startsWith('Loading')) {
        postsGridContainer.innerHTML = ''
        if (results.length === 0) postsGridContainer.innerHTML = '<p>No posts yet. Create one!</p>'
        else {
          results.forEach(post => {
            if (!postsGridContainer.querySelector(`.post-grid-item[data-id="${post.id}"]`)) {
              postsGridContainer.appendChild(createPostGridItemDOM(post.id, post.value))
            }
          })
        }
      }
    } catch (error) {
      console.error('Error subscribing to main grid posts:', error)
      postsGridContainer.innerHTML = `<p>Error loading posts: ${error.message}</p>`
    }
  }

  function createPostGridItemDOM (id, postValue) {
    const item = document.createElement('div')
    item.classList.add('post-grid-item')
    item.dataset.id = id
    item.addEventListener('click', (e) => {
      if (e.target.classList.contains('edit-btn') || e.target.closest('.edit-btn')) {
        return
      }
      window.location.hash = `#/post/${id}`
    })

    const img = document.createElement('img')
    img.classList.add('grid-item-image')
    img.src = postValue.imageUrl || IMAGE_PLACEHOLDER
    img.alt = postValue.title || 'Post Image'
    img.onerror = function () { this.src = IMAGE_PLACEHOLDER }
    item.appendChild(img)

    const infoDiv = document.createElement('div')
    infoDiv.classList.add('grid-item-info')
    infoDiv.innerHTML = `
            <h4>${postValue.title || 'Untitled'}</h4>
            <p class="description">${postValue.description || '<em>No description.</em>'}</p>
            <div class="grid-item-actions">
                <button class="edit-btn" data-edit-id="${id}">Edit</button>
            </div>
        `
    item.appendChild(infoDiv)

    infoDiv.querySelector('.edit-btn').addEventListener('click', (e) => {
      e.stopPropagation()
      window.location.hash = `#/editor/${id}`
    })
    return item
  }

  function updatePostGridItemDOM (element, postValue) {
    const img = element.querySelector('.grid-item-image')
    img.src = postValue.imageUrl || IMAGE_PLACEHOLDER
    img.alt = postValue.title || 'Post Image'
    element.querySelector('h4').textContent = postValue.title || 'Untitled'
    element.querySelector('.description').innerHTML = postValue.description || '<em>No description.</em>'
  }

  // --- LATEST Posts List Logic (Footer) ---
  async function subscribeToLatestPosts () {
    if (unsubscribeLatestPosts) { unsubscribeLatestPosts(); unsubscribeLatestPosts = null }

    latestPostsListUl.innerHTML = '<li>Loading...</li>'

    try {
      const { results, unsubscribe } = await db.map(
        {
          query: { type: 'postMeta' }, // Internal type
          field: 'updatedAt',
          order: 'desc', // Internal order
          $limit: 5
        },
        ({ id, value, action }) => {
          const loadingMsg = latestPostsListUl.querySelector('li')
          if (loadingMsg && loadingMsg.textContent.startsWith('Loading')) latestPostsListUl.innerHTML = ''

          const existingLi = latestPostsListUl.querySelector(`li[data-id="${id}"]`)

          if (action === 'removed') {
            if (existingLi) existingLi.remove()
          } else if (value) {
            let displayTitle = value.title || 'Untitled'
            if (displayTitle.length > 35) { // Shorten long titles for the footer
              displayTitle = `${displayTitle.substring(0, 32)}...`
            }

            const liContent = `
                            <a href="#/post/${id}">${displayTitle}</a>
                            ${value.status === 'draft' ? '<span class="status-draft">(Draft)</span>' : ''}
                        `

            if (existingLi) {
              existingLi.innerHTML = liContent
            } else {
              const newLi = document.createElement('li')
              newLi.dataset.id = id
              newLi.innerHTML = liContent

              // Insert in order or simply add and rebuild at the end (simpler)
              // For now, we add and trust the `results` for the initial order.
              // For a list that must always be sorted in RT, we would need
              // more complex insertion logic or re-render the `results` list from map.
              // Let's try a more ordered insertion
              const existingIds = Array.from(latestPostsListUl.querySelectorAll('li[data-id]')).map(el => el.dataset.id)
              if (!existingIds.includes(id)) { // Avoid duplicates just in case
                // If `map` returns items in the correct order due to field/order,
                // simply appending works.
                latestPostsListUl.appendChild(newLi)
              }
            }
          }
          if (latestPostsListUl.children.length === 0 && !latestPostsListUl.querySelector('li')) {
            latestPostsListUl.innerHTML = '<li>No recent posts.</li>'
          }
        }
      )
      unsubscribeLatestPosts = unsubscribe

      latestPostsListUl.innerHTML = ''
      if (results.length === 0) {
        latestPostsListUl.innerHTML = '<li>No recent posts.</li>'
      } else {
        results.forEach(post => {
          const li = document.createElement('li')
          li.dataset.id = post.id
          let displayTitle = post.value.title || 'Untitled'
          if (displayTitle.length > 35) { // Shorten long titles
            displayTitle = `${displayTitle.substring(0, 32)}...`
          }
          li.innerHTML = `
                        <a href="#/post/${post.id}">${displayTitle}</a>
                        ${post.value.status === 'draft' ? '<span class="status-draft">(Draft)</span>' : ''}
                    `
          latestPostsListUl.appendChild(li)
        })
      }
    } catch (error) {
      console.error('Error subscribing to latest posts:', error)
      latestPostsListUl.innerHTML = '<li>Error loading.</li>'
    }
  }

  // --- Post View Logic ---
  async function loadAndDisplayPost (postId) {
    showSection(postViewSection)
    postViewTitle.textContent = 'Loading post...'
    postViewContent.innerHTML = ''; postViewImage.style.display = 'none'; postViewMeta.textContent = ''

    try {
      const { result: metaNode } = await db.get(postId)
      if (!metaNode || !metaNode.value) {
        alert('Post not found.'); postViewTitle.textContent = 'Error'
        postViewContent.innerHTML = '<p>Error: Post not found.</p>'; return
      }
      const postMeta = metaNode.value
      postViewTitle.textContent = postMeta.title || 'Untitled'
      postViewMeta.textContent = `Status: ${postMeta.status} | Updated: ${new Date(postMeta.updatedAt).toLocaleString()}${postMeta.tags && postMeta.tags.length > 0 ? ` | Tags: ${postMeta.tags.join(', ')}` : ''}`

      if (postMeta.imageUrl) {
        postViewImage.src = postMeta.imageUrl
        postViewImage.alt = postMeta.title || 'Post Image'
        postViewImage.style.display = 'block'
        postViewImage.onerror = function () { this.style.display = 'none' }
      } else {
        postViewImage.style.display = 'none'
      }

      if (postMeta.contentId) {
        const { result: contentNode } = await db.get(postMeta.contentId)
        postViewContent.innerHTML = (contentNode && contentNode.value && typeof contentNode.value.markdown !== 'undefined') ? markdownConverter.makeHtml(contentNode.value.markdown) : '<p>Content not found or empty.</p>'
      } else {
        postViewContent.innerHTML = '<p>Content not linked.</p>'
      }
    } catch (error) {
      console.error('Error loading post for viewing:', error)
      postViewTitle.textContent = 'Error Loading'
      postViewContent.innerHTML = `<p>Error loading: ${error.message}</p>`
    }
  }

  // --- Initial Load ---
  window.addEventListener('hashchange', handleRouteChange)
  handleRouteChange()
})