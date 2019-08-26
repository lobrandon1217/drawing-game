export function randomWord(): string {
    return WORDS[Math.floor(Math.random() * WORDS.length)];
}

const WORDS_RAW = `cheese
bone
socks
leaf
whale
pie
shirt
orange
lollipop
bed
mouth
person
horse
snake
jar
spoon
lamp
kite
monkey
swing
cloud
snowman
baby
eyes
pen
giraffe
grapes
book
ocean
star
cupcake
cow
lips
worm
sun
basketball
hat
bus
chair
purse
head
spider
shoe
ghost
coat
chicken
heart
jellyfish
tree
seashell
duck
bracelet
grass
jacket
slide
doll
spider
clock
cup
bridge
apple
balloon
drum
ears
egg
bread
nose
house
beach
airplane
inchworm
hippo
light
turtle
ball
carrot
cherry
ice
pencil
circle
bed
ant
girl
glasses
flower
mouse
banana
alligator
bell
robot
smile
bike
rocket
dinosaur
dog
bunny
cookie
bowl
apple
door`;

const WORDS = WORDS_RAW.split("\n");