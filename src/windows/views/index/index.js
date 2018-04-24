const fs = require('fs');
const path = require('path');

const app = new Vue({
    el: '#app',
    data(){
        return {
            classData: {
                details: [],
            },
            activeIndex: 0,
            timer: null
        }
    },
    methods:{
        readNameList(){
            const classDataPath = path.join(__dirname,'../../../data','zhiyao3', 'data.json');
            let classData = fs.readFileSync(classDataPath,{
                encoding: 'utf-8'
            });
            classData = JSON.parse(classData);
            this.classData = classData;
        },
        toggleRoll(){
            if(this.timer){
                clearInterval(this.timer);
                this.timer = null;
            }else{
                this.timer = setInterval(()=>{
                    this.activeIndex = ++this.activeIndex > this.classData.details.length - 1 ? 0 : ++this.activeIndex;
                }, 15)
            }
        }
    },
    mounted(){
        this.readNameList()
    }
});