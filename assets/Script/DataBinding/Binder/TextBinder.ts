import { Binding } from "../Binding";
import { BindingManager } from "../BindingManager";
import DataContext from "../DataContext";
import { StringUtility } from "../../Utility/StringUtility";

const {ccclass, property, menu, disallowMultiple, requireComponent} = cc._decorator;

@ccclass
@disallowMultiple
@menu('Binder/TextBinder')
@requireComponent(cc.Label)
export default class TextBinder extends cc.Component
{
    @property
    path: string = "";

    @property
    formatString: string = "";

    public set Text(v : string)
    {
        this.SetLabel(v);
    }

    private binding: Binding;
    private context: DataContext;
    private label: cc.Label;

    start ()
    {
        this.label = this.getComponent(cc.Label);
        if(this.label == null)
        {
            console.error("Require label component.");
            return;
        }
        this.binding = new Binding(this.path, this, "Text");
        this.context = BindingManager.AddBinding(this.binding, this.node);
    }

    onDestroy()
    {
        if(this.context != null && this.binding != null)
        {
            this.context.RemoveBinding(this.binding);
        }
    }

    private SetLabel(str: string)
    {
        let label = this.label;
        if(label == null)
        {
            return;
        }

        if (this.formatString == null || this.formatString == "")
        {
            if (str == null)
            {
                label.string = null;
            }
            else
            {
                label.string = str.toString();
            }
        }
        else
        {
            // Use format string.
            label.string = StringUtility.Format(this.formatString, str);
        }
    }
}