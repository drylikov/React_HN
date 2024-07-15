var React = require('react')

var StoryStore = require('./stores/StoryStore').default

var PageNumberMixin = require('./mixins/PageNumberMixin').default
var Paginator = require('./Paginator').default
var Spinner = require('./Spinner').default
var StoryListItem = require('./StoryListItem').default
var SettingsStore = require('./stores/SettingsStore').default

var {ITEMS_PER_PAGE} = require('./utils/constants').default
var pageCalc = require('./utils/pageCalc').default
var setTitle = require('./utils/setTitle').default

var Stories = React.createClass({
  mixins: [PageNumberMixin],

  propTypes: {
    // The number of stories which may be paginated through
    limit: React.PropTypes.number.isRequired,
    // The route name being used
    route: React.PropTypes.string.isRequired,
    // The type of stories to be displayed
    type: React.PropTypes.string.isRequired,

    // Page title associated with the stories being displayed
    title: React.PropTypes.string
  },

  getInitialState() {
    return {
      ids: null,
      limit: this.props.limit,
      stories: []
    }
  },

  componentDidMount() {
    setTitle(this.props.title)
    this.store = new StoryStore(this.props.type)
    this.store.addListener('update', this.handleUpdate)
    this.store.start()
    this.setState(this.store.getState())
  },

  componentWillUnmount() {
    this.store.removeListener('update', this.handleUpdate)
    this.store.stop()
    this.store = null
  },

  handleUpdate(update) {
    if (!this.isMounted()) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `Skipping update as the ${this.props.type} Stories component is no longer mounted.`
        )
      }
      return
    }
    update.limit = update.ids.length
    this.setState(update)
  },

  render() {
    var page = pageCalc(this.getPageNumber(), ITEMS_PER_PAGE, this.state.limit)

    // Special case for the Read Stories page, as its ids are read from
    // localStorage and there might not be any yet.
    if (this.props.type === 'read') {
      if (this.state.ids == null) {
        return <div className="Items"></div>
      }
      if (this.state.ids.length === 0) {
        return <div className="Items">
          <p>There are no previously read stories to display.</p>
        </div>
      }
    }

    // Display a list of placeholder items while we're waiting for the initial
    // list of story ids to load from Firebase.
    if (this.state.ids == null) {
      var dummyItems = []
      for (var i = page.startIndex; i < page.endIndex; i++) {
        dummyItems.push(
          <li key={i} className="ListItem ListItem--loading" style={{marginBottom: SettingsStore.listSpacing}}>
            <Spinner/>
          </li>
        )
      }
      return <div className="Items Items--loading">
        <ol className="Items__list" start={page.startIndex + 1}>{dummyItems}</ol>
        <Paginator route={this.props.route} page={page.pageNum} hasNext={page.hasNext}/>
      </div>
    }

    return <div className="Items">
      <ol className="Items__list" start={page.startIndex + 1}>
        {this.renderItems(page.startIndex, page.endIndex)}
      </ol>
      <Paginator route={this.props.route} page={page.pageNum} hasNext={page.hasNext}/>
    </div>
  },

  renderItems(startIndex, endIndex) {
    var rendered = []
    for (var i = startIndex; i < endIndex; i++) {
      var item = this.state.stories[i]
      var id = this.state.ids[i]
      if (id) {
        rendered.push(<StoryListItem key={id} id={id} index={i} cachedItem={item} store={this.store}/>)
      }
      else {
        rendered.push(<StoryListItem key={i} cachedItem={item} store={this.store}/>)
      }
    }
    return rendered
  }
})

export default Stories
