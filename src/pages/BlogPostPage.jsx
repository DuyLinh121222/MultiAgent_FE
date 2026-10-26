import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Icon from '../components/common/Icon'
import Loading from '../components/common/Loading'
import ErrorBox from '../components/common/ErrorBox'
import Pet from '../components/game/Pet'
import { publicApi } from '../api/services'
import { getErrorMessage } from '../api/client'
import { formatDate } from '../utils/format'
import { POST_THEMES } from './LandingPage'

/** Xem một bài viết (công khai) */
export default function BlogPostPage() {
  const { postId } = useParams()
  const [post, setPost] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setPost(null)
    publicApi.post(postId).then(setPost).catch((e) => setError(getErrorMessage(e)))
    window.scrollTo({ top: 0 })
  }, [postId])

  if (!post && !error) return <Loading />
  if (!post) return <div className="page"><ErrorBox message={error} /><Link to="/" className="btn-primary w-fit">Về trang chủ</Link></div>
  const th = POST_THEMES[post.theme] || POST_THEMES.BLUE

  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-space-lg px-margin-mobile py-space-lg md:px-margin">
      <Link to="/#tin-tuc" className="flex w-fit items-center gap-1 text-label-lg text-on-surface-variant hover:text-primary">
        <Icon name="arrow_back" className="text-[20px]" /> Tin tức
      </Link>
      <div className={`relative overflow-hidden rounded-[32px] bg-gradient-to-br ${th.bg} p-space-xl text-white`}>
        {post.coverUrl && <img src={post.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />}
        <Pet code={th.pet} size={130} className="absolute -bottom-4 right-4 hidden sm:block" />
        <div className="relative max-w-lg">
          {post.tag && <span className={`chip ${th.chip}`}>{post.tag}</span>}
          <h1 className="mt-space-sm text-[28px] font-black leading-tight sm:text-[34px]">{post.title}</h1>
          <div className="mt-space-sm text-label-md text-white/85">{post.authorName} • {formatDate(post.createdAt)}</div>
        </div>
      </div>
      {post.summary && <p className="text-body-lg font-semibold text-on-surface">{post.summary}</p>}
      <div className="flex flex-col gap-space-sm text-body-lg text-on-surface">
        {post.content.split('\n').map((line, i) => {
          const t = line.trim()
          if (!t) return <div key={i} className="h-1" />
          if (t.startsWith('•')) {
            return (
              <div key={i} className="flex gap-2 pl-1">
                <span className="mt-[10px] h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                <span>{t.slice(1).trim()}</span>
              </div>
            )
          }
          return <p key={i}>{t}</p>
        })}
      </div>
      <div className="flex flex-wrap gap-space-sm rounded-[24px] bg-primary-fixed/50 p-space-lg">
        <div className="flex-1 text-headline-sm text-on-primary-fixed">Muốn thử ngay?</div>
        <Link to="/login?mode=register" className="btn-primary"><Icon name="rocket_launch" className="text-[18px]" /> Học thử 7 ngày 0đ</Link>
      </div>
    </article>
  )
}
