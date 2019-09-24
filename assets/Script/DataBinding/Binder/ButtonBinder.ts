import { Binding } from "../Binding";
import DataContext from "../DataContext";
import { BindingManager } from "../BindingManager";

const {ccclass, property, menu, requireComponent, disallowMultiple} = cc._decorator;

@ccclass
@disallowMultiple
@menu('Binder/ButtonBinder')
@requireComponent(cc.Button)
export default class ButtonBinder extends cc.Component
{
    @property
    path: string = "";

    @property
    interactablePath: string = "";

    public set Interactable(v : boolean)
    {
        let currentValue = this.button.interactable;

        if (currentValue != v)
        {
            this.button.interactable = v;
        }
    }

    public Command: () => void = null;
    
    private binding: Binding;
    private interactableBinding: Binding;
    private context: DataContext;
    private button: cc.Button;
    private handler: cc.Component.EventHandler;

    start ()
    {
        this.button = this.getComponent(cc.Button);
        if(this.button == null)
        {
            console.error("Require button component.");
            return;
        }
        
        this.binding = new Binding(this.path, this, "Command");
        this.context = BindingManager.AddBinding(this.binding, this.node);

        if(this.interactablePath != null && this.interactablePath != "")
        {
            this.interactableBinding = new Binding(this.interactablePath, this, "Interactable");
            BindingManager.AddBinding(this.interactableBinding, this.node);
        }

        this.handler = new cc.Component.EventHandler();
        this.handler.target = this.node;
        this.handler.component = "ButtonBinder";
        this.handler.handler = "OnClick";
        this.button.clickEvents.push(this.handler);
    }

    onDestroy()
    {
        if(this.context != null && this.binding != null)
        {
            this.context.RemoveBinding(this.binding);
            this.context.RemoveBinding(this.interactableBinding);
        }

        if(this.button != null && this.button.clickEvents != null)
        {
            let index = this.button.clickEvents.indexOf(this.handler);
            this.button.clickEvents.splice(index, 1);
        }
    }

    private OnClick()
    {
        if (this.binding.IsBound && this.Command != null)
        {
            this.Command.bind(this.binding.Source)();
        }
    }
}