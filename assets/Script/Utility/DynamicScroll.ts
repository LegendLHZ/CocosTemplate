/*
 *
 *
 */

const {ccclass, property} = cc._decorator;

@ccclass
export default class DynamicScroll extends cc.Component
{
    @property
    isHorizontal = false;

    @property(cc.Prefab)
    viewPrefab: cc.Prefab = null;

    @property
    initCount: number = 5;

    @property
    itemCountOfRow: number = 1;

    @property(cc.Vec2)
    space: cc.Vec2 = cc.Vec2.ZERO;

    @property
    leftPadding: number = 0;

    @property
    rightPadding: number = 0;

    @property
    topPadding: number = 0;

    @property
    bottomPadding: number = 0;

    private scrollView: cc.ScrollView;
    private viewPool: cc.NodePool;
    private thisRect;
    private m_callback;
    private positions = [];

    // For current list.
    private currentList = [];
    private currentNodeList = [];
    private currentStartIndex = 0;
    private currentEndIndex = 0;

    private inited = false;
    private addCount = 0;

    onLoad()
    {
        this.scrollView = this.getComponent(cc.ScrollView);

        var eventHander = new cc.Component.EventHandler();
        eventHander.target = this.node;
        eventHander.component = "DynamicScroll";
        eventHander.handler = "OnScrollChange";
        this.scrollView.scrollEvents.push(eventHander);

        this.viewPool = new cc.NodePool();
        for (let i = 0; i < this.initCount; ++i)
        {
            let view = cc.instantiate(this.viewPrefab);
            this.viewPool.put(view);
        }

        this.thisRect = this.GetNodeRect(this.node);

        this.inited = true;

        for (let i = 0; i < this.addCount; ++i)
        {
            this.AddItem();
        }
    }

    private OnScrollChange()
    {
        if(this.positions.length == 0)
        {
            return;
        }

        if(this.ItemIsInRect(this.currentStartIndex))
        {
            var p_index = this.currentStartIndex - 1;
            if(this.ItemIsInRect(p_index))
            {
                this.CheckAddItem(p_index, true);
            }
        }
        else
        {
            this.CheckRemoveItem(this.currentStartIndex);
        }

        if(this.ItemIsInRect(this.currentEndIndex))
        {
            var n_index = this.currentEndIndex + 1;
            if(this.ItemIsInRect(n_index))
            {
                this.CheckAddItem(n_index);
            }
        }
        else
        {
            this.CheckRemoveItem(this.currentEndIndex, true);
        }
    }

    private CheckAddItem(startIndex: number, isForward = false)
    {
        var index = startIndex;
        while(index >= 0 && index < this.positions.length)
        {
            if(!this.ItemIsInRect(index))
            {
                return;
            }

            this.AddToCurrentList(index);

            if(isForward)
            {
                this.currentStartIndex = index;
                index--;
            }
            else
            {
                this.currentEndIndex = index;
                index++;
            }
        }
    }

    private CheckRemoveItem(startIndex: number, isForward = false)
    {
        var index = startIndex;
        while(index >= this.currentStartIndex && index <= this.currentEndIndex)
        {
            if(this.ItemIsInRect(index))
            {
                return;
            }

            this.RemoveFromCurrentList(index);

            if(isForward)
            {
                index--;
                this.currentEndIndex = index;
            }
            else
            {
                index++;
                this.currentStartIndex = index;
            }
        }
    }

    private AddToCurrentList(index)
    {
        var view = this.GetView();
        this.scrollView.content.addChild(view);
        view.position = this.positions[index];

        this.currentList.push(index);
        this.currentNodeList.push(view);
        var res = {
            index: index,
            node: view
        }

        if(this.m_callback != null)
        {
            this.m_callback(res);
        }
    }

    private RemoveFromCurrentList(index)
    {
        var _index = this.currentList.indexOf(index);
        this.viewPool.put(this.currentNodeList[_index]);
        this.currentNodeList.splice(_index, 1);
        this.currentList.splice(_index, 1);
    }

    private GetNodeRect(node: cc.Node): any
    {
        var worldPos = node.convertToWorldSpaceAR(cc.Vec2.ZERO);
        var minX = worldPos.x - node.anchorX * node.width;
        var maxX = worldPos.x + (1 - node.anchorX) * node.width;
        var minY = worldPos.y - node.anchorY * node.height;
        var maxY = worldPos.y + (1 - node.anchorY) * node.height;
        var rect = {
            minX: minX,
            maxX: maxX,
            minY: minY,
            maxY: maxY
        }
        return rect;
    }

    private ItemIsInRect(index): boolean
    {
        if(index < 0 || index >= this.positions.length)
        {
            return false;
        }
        
        var item = this.positions[index];

        var worldPos = this.scrollView.content.convertToWorldSpaceAR(cc.Vec2.ZERO);
        var x = item.x + worldPos.x;
        var y = item.y + worldPos.y;
        var rect = {
            minX: x - this.space.x / 2,
            maxX: x + this.space.x / 2,
            minY: y - this.space.y / 2,
            maxY: y + this.space.y / 2
        }

        return this.IsInRect(rect);
    }

    private IsInRect(rect): boolean
    {
        return !(rect.maxX < this.thisRect.minX || this.thisRect.maxX < rect.minX || rect.maxY < this.thisRect.minY || this.thisRect.maxY < rect.minY);
    }

    private GetView(): cc.Node
    {
        let view = null;
        if (this.viewPool.size() > 0)
        {
            view = this.viewPool.get();
        }
        else
        {
            view = cc.instantiate(this.viewPrefab);
        }
        return view;
    }

    private AddItem()
    {
        var index = this.positions.length;

        // Init position;
        var pos = new cc.Vec2();
        if(this.isHorizontal)
        {
            var spaceX = Math.floor(index / this.itemCountOfRow) * this.space.x;
            this.scrollView.content.width = this.leftPadding + this.rightPadding + spaceX;

            pos.x = this.leftPadding + spaceX;
            pos.y = -(this.topPadding + (index % this.itemCountOfRow) * this.space.y);
        }
        else
        {
            var spaceY = Math.floor(index / this.itemCountOfRow) * this.space.y;
            this.scrollView.content.height = this.topPadding + this.bottomPadding + spaceY;

            pos.x = this.leftPadding + (index % this.itemCountOfRow) * this.space.x;
            pos.y = -(this.topPadding + spaceY);
        }
        this.positions.push(pos);

        if(this.ItemIsInRect(index))
        {
            this.AddToCurrentList(index);
            this.currentEndIndex = index;
        }
    }

    public OnInitItem(callback)
    {
        this.m_callback = callback;
    }

    public Add(count: number)
    {
        if(!this.inited)
        {
            this.addCount = count;
            return;
        }

        for (let i = 0; i < count; ++i)
        {
            this.AddItem();
        }
    }

    public Clear()
    {
        var self = this;
        this.currentNodeList.forEach(element => {
            self.viewPool.put(element);
        });

        this.positions = [];
        this.currentList = [];
        this.currentNodeList = [];
        this.currentStartIndex = 0;
        this.currentEndIndex = 0;

        if(this.scrollView == null)
        {
            return;
        }

        if(this.isHorizontal)
        {
            this.scrollView.content.width = 0;
        }
        else
        {
            this.scrollView.content.height = 0;
        }
    }
}