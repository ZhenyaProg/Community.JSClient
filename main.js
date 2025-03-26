import AppState from "./appState.js"

const uri = "https://localhost:7264/api/todos"
const pagination = {
    page: 1,
    pageSize: 3
}
let state = AppState.Default
let editedTodoId

const todoWrapper = document.getElementById("todo-wrapper")
const nextPageBttn = document.getElementById("next-todos")
const prevPageBttn = document.getElementById("prev-todos")
const pageNumber = document.getElementById("page-number")
const addBttn = document.getElementById("add-todo")
const editForm = document.getElementById("edit-form")
const todoTitleInp = document.getElementById("todo-title")
const todoSuccessInp = document.getElementById("todo-success")
const todoDeadlineInp = document.getElementById("todo-deadline")
const todoDescInp = document.getElementById("edit-desc")

//#region Functions

const formatDate = (date) => {
    const parts = date.substring(0, 10).split('-')
    return `${parts[0]}-${parts[1]}-${parts[2]}`
}

const renderTodo = (todo) => {
    return `<div id=todo-${todo.id} class="todo-item">
                <div class="todo-item-info">
                    <p class="todo-title">${todo.title}</p>
                    <div class="todo-info">
                        <input type="checkbox" class="todo-success" disabled ${(todo.success == true ? "checked" : "")}>
                        <p class="deadline">${formatDate(todo.deadline)}</p>
                    </div>
                </div>
                <button class="remove-todo">Удалить</button>
            </div>`
}

const updateTodos = async () => {
    try {
        const response = await fetch(uri + `?page=${pagination.page}&pageSize=${pagination.pageSize}`)
        const todos = await response.json()
        renderTodos(todos)
    } catch(e) {
        console.log(`Error - ${e.message}`);
        alert(e.message)
    }
}

const resetAfterEdit = () => {
    todoWrapper.style.display = "block"
    editForm.style.display = "none"

    todoTitleInp.value = ""
    todoSuccessInp.checked = false
    todoDeadlineInp.value = Date.now()
    todoDescInp.value = ""

    state = AppState.Default
}

const createTodo = async () => {
    try {
        const request = {
            method: "POST",
            body: JSON.stringify({
                "title": todoTitleInp.value.trim(),
                "success": todoSuccessInp.checked,
                "deadline": todoDeadlineInp.value,
                "description": todoDescInp.value.trim()
            }),
            headers: { "Content-Type": "application/json" }
        }
        
        const response = await fetch(uri, request)
        const data = await response.json()
        if(!response.ok) {
            resetAfterEdit()
            if(response.status == 400) {
                throw new Error(JSON.stringify(data.errors))
            }
            throw new Error("че-то сломалось")
        }
        await updateTodos()
        resetAfterEdit()
        
    } catch(e) {
        console.log(`Error - ${e.message}`);
        alert(e.message)
    }
}

const deleteTodo = async(id) => {
    try {
        await fetch(`${uri}?deletedId=${id}`, {method: "DELETE"})
        await updateTodos()
    } catch(e) {
        console.log(`Error - ${e.message}`);
        alert(e.message)
    }
}

const renderTodos = (todoArr) => {
    todoWrapper.innerHTML = ""
    for (const todo of todoArr) {
        todoWrapper.insertAdjacentHTML("beforeend", renderTodo(todo))
        const todoEl = todoWrapper.querySelector(`#todo-${todo.id}`)
        const removeBttnEl = todoEl.getElementsByClassName("remove-todo")[0]
        removeBttnEl.onclick = async function() {
            todoEl.onclick = null
            await deleteTodo(todo.id)
        }
        todoEl.onclick = function() {
            enableEditForm(todo)
            console.log(`click on ${todo.title}`);
        }
    }
}

const enableEditForm = (todo) => {
    editedTodoId = todo.id
    state = AppState.Edited
    todoWrapper.style.display = "none"
    editForm.style.display = "block"
    const date = todo.deadline
    todoTitleInp.value = todo.title
    todoSuccessInp.checked = todo.success
    todoDeadlineInp.value = formatDate(date)
    todoDescInp.value = todo.description
}

const editTodo = async () => {
    try {
        const request = {
            method: "PUT",
            body: JSON.stringify({
                "title": todoTitleInp.value.trim(),
                "success": todoSuccessInp.checked,
                "deadline": todoDeadlineInp.value,
                "description": todoDescInp.value.trim()
            }),
            headers: { "Content-Type": "application/json" }
        }
        await fetch(`${uri}?editedId=${editedTodoId}`, request)
        await updateTodos()

        resetAfterEdit()
    } catch(e) {
        console.log(`Error - ${e.message}`);
        alert(e.message)
    }
}

//#endregion

//#region Events

nextPageBttn.addEventListener("click", async () => {
    pagination.page++
    pageNumber.innerText = pagination.page
    await updateTodos()
})

prevPageBttn.addEventListener("click", async () => {
    pagination.page = pagination.page == 1 ? 1 : pagination.page - 1
    pageNumber.innerText = pagination.page
    await updateTodos()
})

addBttn.addEventListener("click", () => {
    todoWrapper.style.display = "none"
    editForm.style.display = "block"
    todoDescInp.value = ""
    state = AppState.Created
})

editForm.addEventListener("submit", async (e) => {
    e.preventDefault()
    if(state == AppState.Created) {
        await createTodo()
    } else if(state == AppState.Edited) {
        await editTodo()
    }
})

editForm.addEventListener("reset", (e) => {
    e.preventDefault()
    resetAfterEdit()
})

//#endregion

await updateTodos()