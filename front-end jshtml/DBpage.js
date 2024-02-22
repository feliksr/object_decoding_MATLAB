//datapage.js

class DBpage{

    constructor(){

        this.groupTypes = {
            'Target Stimulus' : ['Soccerball','Trophy','Vase'],
            'Stimulus Type' : ['Target','Distractor','Irrelevant'],
            'Stimulus Identity' :  ['Soccerball', 'Trophy', 'Vase']
        }        

        this.channelIdx = 0
    }

    intialize(){

        const ids = [
            'nextChan', 'prevChan', 'chanSelect', 'channelButtonContainer',
            'excludeTrialButton', 'buttonANOVA', 
            'groupButtonContainer', 'xAxisLabel', 'heatmapView'
        ];

        fetch('heatmap.html')

        .then(response => response.text())

        .then(html => {
            document.getElementById('heatmapView').innerHTML = html;

            ids.forEach(id => {
                this[id] = document.getElementById(id);
            });

            dataLink.clear_Cache()
            this.init_GroupButtons()
            this.set_ChannelButtons()
            viewer.init_ButtonMean()
            viewer.init_ButtonANOVA(dataLink)
            viewer.set_ButtonBaseline()
            
            // this.set_excludeTrialButton()
            xAxisLabel.textContent = 'Time from button-press response (sec)'
        })

        .catch(error => console.error('Error:', error));
    }

    
    async init_GroupButtons() {

        let container = this.groupButtonContainer
        
        while (container.firstChild){
            container.removeChild(container.firstChild)
        }

        let params = new URLSearchParams(window.location.search);

        let stimGroup = params.get('params');

        let allGroups  = this.groupTypes[stimGroup];

        allGroups.forEach(str => {
            
            let groupButton = document.createElement('button');
            groupButton.className = 'groupButton';
            groupButton.textContent = str;
            groupButton.group = str
            groupButton.stimGroup = stimGroup
            container.appendChild(groupButton)
            groupButton.groupNumber = container.children.length

            this.set_GroupButtonClick(groupButton)
        });
    }

    
    set_GroupButtonClick(groupButton){

        groupButton.addEventListener('click', async () => {
                
            await this.set_GroupButtonData(groupButton)
            
            let data
            if (!buttonANOVA.classList.contains('active')){
                document.querySelectorAll('.groupButton')
                
                .forEach(button => 
                    button.classList.remove('active')
                );
                
                data = groupButton

            } else if(buttonANOVA.classList.contains('active')){
                data = await viewer.run_ANOVA(groupButton,dataLink)
            }
            
            groupButton.classList.add('active'); 
            
            viewer.view_Trials(data)
        })
    }
    

    async set_GroupButtonData(button){
               
        if (!this.chanNumbers){

            const chans      = await dataLink.get_Chans(button)
            this.chanNumbers = chans.chanNumbers;
            this.chanLabels  = chans.chanLabels;
            this.set_ChannelSelect()
        } 
        
        button.chanNumbers =  this.chanNumbers;
        button.chanLabels = this.chanLabels;
        
        if (!button.wavelets){
            console.log('got data')
            
            const responseData = await dataLink.get_Data(button,this.channelIdx);
            const data = dataLink.parse_Data(responseData)
            button.wavelets = data.wavelets
            button.LFPs = data.LFPs
        }

    }

    set_ChannelButtons(){
       
        prevChan.addEventListener('click', () => {
            if (chanSelect.selectedIndex > 0) {
                chanSelect.selectedIndex--;  
                chanSelect.dispatchEvent(new Event('change'));
            }
        })
        
        nextChan.addEventListener('click', () => {
            if (chanSelect.selectedIndex < chanSelect.options.length - 1) {
                chanSelect.selectedIndex++; 
                chanSelect.dispatchEvent(new Event('change'));
            }            
        })
    }


    set_ChannelSelect(){
   
        
        this.chanNumbers.forEach((number, index) => {
            const channel = document.createElement('option');
            channel.innerHTML = 'Channel #' + number + '&nbsp;&nbsp;&nbsp;&nbsp;' + this.chanLabels[index];

            chanSelect.appendChild(channel);
        });

        chanSelect.addEventListener('change', () => {
            dataLink.clear_Cache()
            this.channelIdx = chanSelect.selectedIndex
            this.init_GroupButtons();
        });

        channelButtonContainer.style.display = 'flex';
    }

}
const dataLink = new LinkAPI()
const viewer = new Elements()
const page = new DBpage();
page.intialize();