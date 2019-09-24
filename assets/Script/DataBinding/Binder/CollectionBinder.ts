import { BindingManager } from "../BindingManager";
import { Binding } from "../Binding";
import DataContext from "../DataContext";

const {ccclass, property, menu} = cc._decorator;

@ccclass
@menu('Binder/CollectionBinder')
export default class CollectionBinder extends cc.Component
{
    @property
    path: string = "";

    @property(cc.Prefab)
    viewTemplate: cc.Prefab = null;

    @property(cc.Node)
    container: cc.Node = null;

    private _array: Array<any> = null;
    public get array(): Array<any>
    {
        return this._array;
    }
    public set array(newValue)
    {
        this._array = newValue;
        this.RefreshView();
    }
    
    private binding: Binding;
    private context: DataContext;
    private viewItemList: Array<{ node: cc.Node, itemModel: any }> = [];

    start ()
    {
        if(this.viewTemplate == null || this.container == null)
        {
            console.error("ViewTemplate ot container is null ->", this.node.name);
            return;
        }

        let node = cc.instantiate(this.viewTemplate);
        if(node.getComponent(DataContext) == null)
        {
            console.error("ViewTemplate need DataContext component ->", node.name);
            return;
        }

        this.binding = new Binding(this.path, this, "array");
        this.binding.OnCollectionChange = this.OnCollectionChange.bind(this);
        this.context = BindingManager.AddBinding(this.binding, this.node);
    }

    onDestroy()
    {
        if(this.context != null && this.binding != null)
        {
            this.context.RemoveBinding(this.binding);
        }
    }

    private CreateItemView(source: object, inFront: boolean = false): cc.Node
    {
        let node = cc.instantiate(this.viewTemplate);
        if(!node.active)
        {
            node.active = true;
        }
        node.setParent(this.container);
        if(inFront)
        {
            node.setSiblingIndex(0);
        }

        let context = node.getComponent(DataContext);
        if(source != null)
        {
            context.SetSource(source);
        }

        this.viewItemList.push({node: node, itemModel: source});

        return node;
    }

    private RemoveItemView(item: { node: cc.Node, itemModel: any })
    {
        let index = this.viewItemList.indexOf(item);
        if(index < 0)
        {
            return;
        }

        this.viewItemList.splice(index, 1);

        this.container.removeChild(item.node);
    }

    private RefreshView()
    {
        // Remove old items.
        if(this.viewItemList.length != 0)
        {
            this.viewItemList.forEach(item => {
                this.container.removeChild(item.node);
            });
        }
        this.viewItemList.splice(0, this.viewItemList.length);

        // Add new items.
        if(this._array == null)
        {
            return;
        }
        var self = this;
        this._array.forEach(item => {
            self.CreateItemView(item);
        });
    }

    private Reverse()
    {
        var array = this._array;
        for (let index = 0; index < array.length / 2; index++) {
            const front = array[index];
            const last = array[array.length - 1 - index];
            var frontNode = this.viewItemList.filter(item => { return item.itemModel == front; })[0].node;
            var lastNode = this.viewItemList.filter(item => { return item.itemModel == last; })[0].node;
            var i = frontNode.getSiblingIndex();
            frontNode.setSiblingIndex(lastNode.getSiblingIndex());
            lastNode.setSiblingIndex(i);
        }
    }

    public OnCollectionChange(action: string, args: any[])
    {
        //['push', 'pop', 'shift', 'unshift', 'sort', 'reverse', 'splice']
        if(action == "reverse")
        {
            this.Reverse();
        }
        else if(action == "sort")
        {
            this.RefreshView();
        }
        else if(action == "push")
        {
            for (let index = 0; index < args.length; index++)
            {
                this.CreateItemView(args[index]);
            }
        }
        else if(action == "pop" || action == "shift")
        {
            if(args.length > 0)
            {
                var result = this.viewItemList.filter(item => { return item.itemModel == args[0]; });
                if(result != null && result.length > 0)
                {
                    this.RemoveItemView(result[0]);
                }
            }
        }
        else if(action == "unshift")
        {
            for (let i = args.length - 1; i >= 0 ; i--)
            {
                this.CreateItemView(args[i], true);
            }
        }
        else if(action == "splice")
        {
            for (let i = 0; i < args.length; i++)
            {
                let result = this.viewItemList.filter(item => { return item.itemModel == args[i]; });
                if(result != null && result.length > 0)
                {
                    this.RemoveItemView(result[0]);
                }
            }
        }
    }
}