import { Binding } from "../Binding";
import DataContext from "../DataContext";
import { BindingManager } from "../BindingManager";

const {ccclass, property, requireComponent, menu} = cc._decorator;

@ccclass
@requireComponent(cc.Sprite)
@menu('Binder/SpriteFillBinder')
export default class SpriteFillBinder extends cc.Component
{
    @property
    path: string = "";

    private binding: Binding;
    private context: DataContext;
    private sprite: cc.Sprite;

    start ()
    {
        this.sprite = this.getComponent(cc.Sprite);
        if(this.sprite == null)
        {
            console.error("Require sprite component.");
            return;
        }

        this.binding = new Binding(this.path, this, "sprite.fillRange");
        this.context = BindingManager.AddBinding(this.binding, this.node);
    }

    onDestroy()
    {
        if(this.context != null && this.binding != null)
        {
            this.context.RemoveBinding(this.binding);
        }
    }
}