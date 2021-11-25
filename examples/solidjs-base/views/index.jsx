import { Link } from 'solid-app-router'

export const path = '/'

export default function Index () {
  return (
    <>
      <h1>Index Page</h1>
      <p>Go to <Link to="/about">/about</Link></p>
    </>
  )
}
