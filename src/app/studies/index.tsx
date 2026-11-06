import { Redirect, type Href } from 'expo-router';
export default function RetiredLink() { return <Redirect href={'/catalog' as Href} />; }
