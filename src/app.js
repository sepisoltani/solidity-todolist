var app = new Vue({
    el: '#app',
    data() {
        return {
            account: '',
            web3Provider: {},
            web3: {},
            TodoListContract: {},
            todoList: {},
            taskCount: 0,
            tasks: [],
            newTask: ''
        }
    },
    async created() {
        await this.loadWeb3()
        await this.loadAccount();
        await this.loadContract();
        await this.getTasksCountFromContract();
        await this.getTaskFromContract();
        await this.renderTasks()

    },
    methods: {
        async loadWeb3() {
            if (window.ethereum) {
                window.web3 = new Web3(ethereum)
                try {
                    // Request account access if needed
                    await ethereum.request({method: 'eth_requestAccounts'})
                } catch (error) {
                    alert(error.message)
                }
            }
        },
        async loadAccount() {
            // Set the current blockchain account
            const accounts = await window.web3.eth.getAccounts();
            console.log(accounts)
            this.account = accounts[0]
            console.log(this.account)
        },
        async loadContract() {
            let response = await axios.get("TodoList.json");
            this.TodoListContract = TruffleContract(response.data)
            this.TodoListContract.setProvider(ethereum)
            this.todoList = await this.TodoListContract.deployed()
        },
        async getTasksCountFromContract() {
            const taskCount = await this.todoList.taskCount()
            this.taskCount = Number(taskCount)
            console.log(this.taskCount)
        },
        async getTaskFromContract() {
            let tasks = [];
            for (let i = 1; i <= this.taskCount; i++) {
                // get the task data from the blockchain
                let task = await this.todoList.tasks(i)
                let taskItem = {
                    taskId: task[0].toNumber(),
                    taskContent: task[1],
                    taskCompleted: task[2]
                }
                tasks.push(taskItem)
            }
            this.tasks = tasks;
            console.log(tasks)
        },
        async renderTasks() {
            let tasksContainer = this.$refs.tasks;
            let row = ""
            for (let i = 0; i < this.tasks.length; i++) {
                row += "<label class='list-group-item'><input id='task-" + this.tasks[i].taskId + "' id='task-" + this.tasks[i].taskId + "'  class='form-check-input me-1' type='checkbox'   >" + this.tasks[i].taskContent + "</label>"
            }
            tasksContainer.innerHTML = row
        },
        cleanTasksView() {
            let tasksContainer = this.$refs.tasks;
            tasksContainer.innerHTML = ""
        },
        async onEnter() {
            if (this.newTask.length > 0) {
                await this.todoList.createTask(this.newTask, {from: this.account})
                await this.getTasksCountFromContract()
                await this.getTaskFromContract()
                await this.renderTasks()
            }
        }
    },
});