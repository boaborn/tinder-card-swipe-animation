import React, { Component } from 'react'
import {
  View,
  Animated,
  PanResponder,
  Dimensions,
  LayoutAnimation,
  UIManager
} from 'react-native'

const SCREEN_WIDTH = Dimensions.get('window').width
const SWIPE_THRESHOLD = 0.25 * SCREEN_WIDTH
const SWIPE_OUT_DURATION = 250

class Deck extends Component {

  static defaultProps = {
    onSwipeRight: () => {}, // If no onSwipeRight function from props, then assign this one
    onSwipeLeft: () => {}
  }

  constructor(props) {
    super(props)
    const position = new Animated.ValueXY()
    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true, // function called when users are pressing screen, true = use this handler
      onPanResponderMove: (event, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy })
      },
      onPanResponderRelease: (event, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          this.forceSwipe('right')
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          this.forceSwipe('left')
        } else {
          this.resetPosition()
        }
      }
    })
    this.state = { panResponder, position, index: 0 }
  }

  componentWillReceiveProps(nextProps) {
    // This does not compare the object, it compares the object in the memory
    if (nextProps.data !== this.props.data) {
      this.setState({ index: 0 })
    }
  }

  componentWillUpdate() {
    // Handle Android
    UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true)
    // Next time when this compoent will update, apply this animation to all changes
    LayoutAnimation.spring()
  }

  forceSwipe(direction) {
    const x = direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH
    Animated.timing(this.state.position, {
      toValue: { x, y: 0 },
      duration: SWIPE_OUT_DURATION
    }).start(() => this.onSwipeComplete(direction))
  }

  onSwipeComplete(direction) {
    const { onSwipeLeft, onSwipeRight, data } = this.props
    const item = data[this.state.index]

    direction === 'right' ? onSwipeRight(item) : onSwipeLeft(item)

    // After swipe completed, reset position to [0,0] for next card
    this.state.position.setValue({ x: 0, y: 0 })

    // Move to next card
    this.setState({ index: this.state.index + 1 })
  }

  resetPosition() {
    Animated.spring(this.state.position, {
      toValue: { x: 0, y: 0 }
    }).start()
  }

  getCardStyle() {
    const { position } = this.state
    const rotate = position.x.interpolate({
      inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
      outputRange: ['-120deg', '0deg', '120deg']
    })

    return {
      ...position.getLayout(),
      transform: [{ rotate }]
    }
  }

  renderCards() {
    // No more card to render
    if (this.state.index >= this.props.data.length) {
      return this.props.renderNoMoreCards()
    }

    return this.props.data.map((item, i) => {
      // Do not render cards has been swiped out
      if (i < this.state.index) {
        return null
      }

      // The card for swipe
      if (i === this.state.index) {
        return (
          <Animated.View
            key={ item.id }
            style={ [this.getCardStyle(), styles.cardStyle] }
            { ...this.state.panResponder.panHandlers }
          >
            { this.props.renderCard(item) }
          </Animated.View>
        )
      }

      return (
        <Animated.View key={ item.id }
          style={ [styles.cardStyle, { top: 10 * (i - this.state.index) }] }
        >
          { this.props.renderCard(item) }
        </Animated.View>
      )
    }).reverse()
  }

  render() {
    return (
      <View>
        { this.renderCards() }
      </View>
    )
  }
}

const styles = {
  cardStyle: {
    position: 'absolute',
    width: SCREEN_WIDTH
  }
}

export default Deck
